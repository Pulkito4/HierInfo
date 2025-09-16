"""Database operations for the pipeline."""
import logging
from typing import List, Dict, Optional
from supabase import create_client, Client
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class DatabaseWriter:
    """Handles all database operations for the news pipeline."""
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def save_articles(self, articles: List[Dict], batch_size: int = 100) -> List[str]:
        """
        Save processed articles to the database.
        
        Args:
            articles: List of processed article dictionaries
            batch_size: Number of articles to insert per batch
            
        Returns:
            List of inserted article IDs
        """
        logger.info(f"Saving {len(articles)} articles to database")
        
        inserted_ids = []
        article_data_for_related = []
        
        # Process articles in batches
        for i in range(0, len(articles), batch_size):
            batch = articles[i:i + batch_size]
            batch_ids = self._save_article_batch(batch)
            
            if batch_ids:
                # Store article data for related table operations
                for j, article_id in enumerate(batch_ids):
                    article_data_for_related.append({
                        'id': article_id,
                        'article_data': batch[j]
                    })
                
                inserted_ids.extend(batch_ids)
            
            logger.info(f"Saved batch {i//batch_size + 1}/{(len(articles) + batch_size - 1)//batch_size}")
        
        # Save embeddings and categories for all inserted articles
        if article_data_for_related:
            self._save_embeddings(article_data_for_related)
            self._save_categories(article_data_for_related)
        
        logger.info(f"Successfully saved {len(inserted_ids)} articles with embeddings and categories")
        return inserted_ids
    
    def _save_article_batch(self, articles: List[Dict]) -> List[str]:
        """Save a batch of articles to the database."""
        try:
            # Prepare articles for database insertion
            db_articles = []
            for article in articles:
                db_article = self._prepare_article_for_db(article)
                if db_article:
                    db_articles.append(db_article)
            
            if not db_articles:
                logger.warning("No valid articles to save in batch")
                return []
            
            # Insert into news_articles table
            result = self.client.table("news_articles").insert(db_articles).execute()
            
            # Extract IDs from result
            inserted_ids = [row['id'] for row in result.data]
            return inserted_ids
            
        except Exception as e:
            logger.error(f"Error saving article batch: {e}")
            return []
    
    def _prepare_article_for_db(self, article: Dict) -> Optional[Dict]:
        """Prepare article data for database insertion."""
        try:
            # Required fields check
            if not article.get('title') or not article.get('url'):
                logger.warning("Skipping article without title or URL")
                return None
            
            # Prepare the database record matching actual schema
            # Schema: id, title, summary, url, source, image_url, published_at, trending_score, is_critical, created_at
            db_article = {
                'title': article.get('title', '')[:500],  # Limit title length
                'summary': article.get('summary', ''),
                'url': article.get('url', ''),
                'source': article.get('source_name', 'GNews'),
                'image_url': article.get('image_url') or article.get('scraped_image'),
                'published_at': self._format_datetime(article.get('published_at')),
                'trending_score': int(article.get('trending_score', 0.5) * 100),  # Convert to integer
                'is_critical': article.get('is_critical', False),
            }
            
            return db_article
            
        except Exception as e:
            logger.error(f"Error preparing article for database: {e}")
            return None
    
    def _format_datetime(self, dt) -> Optional[str]:
        """Format datetime for database insertion."""
        if dt is None:
            return None
            
        if isinstance(dt, str):
            return dt
            
        if hasattr(dt, 'isoformat'):
            return dt.isoformat()
            
        return None
    
    def _calculate_quality_score(self, article: Dict) -> float:
        """Calculate a quality score for the article."""
        score = 0.0
        
        # Content length score (0-0.3)
        content = article.get('content') or article.get('scraped_content', '')
        if content:
            content_score = min(len(content) / 2000, 1.0) * 0.3
            score += content_score
        
        # Metadata completeness (0-0.2)
        metadata_fields = ['title', 'description', 'source_name', 'published_at']
        metadata_score = sum(1 for field in metadata_fields if article.get(field))
        score += (metadata_score / len(metadata_fields)) * 0.2
        
        # Successful processing (0-0.3)
        if article.get('scraping_success'):
            score += 0.1
        if article.get('summary'):
            score += 0.1
        if article.get('keywords'):
            score += 0.1
        
        # Category confidence (0-0.2)
        category_confidence = article.get('category_confidence', 0)
        score += category_confidence * 0.2
        
        return min(score, 1.0)
    
    def _save_embeddings(self, article_data_list: List[Dict]) -> None:
        """Save embeddings for articles to news_embeddings table."""
        try:
            embeddings_to_save = []
            
            for item in article_data_list:
                article_id = item['id']
                article = item['article_data']
                embedding = article.get('embedding')
                
                if embedding and isinstance(embedding, list):
                    embeddings_to_save.append({
                        'article_id': article_id,
                        'embedding': embedding
                    })
            
            if embeddings_to_save:
                result = self.client.table("news_embeddings").insert(embeddings_to_save).execute()
                logger.info(f"Saved {len(embeddings_to_save)} embeddings")
            
        except Exception as e:
            logger.error(f"Error saving embeddings: {e}")
    
    def _save_categories(self, article_data_list: List[Dict]) -> None:
        """Save categories for articles to categories and article_categories tables."""
        try:
            # First, ensure all categories exist
            categories_to_create = set()
            article_categories = []
            
            for item in article_data_list:
                article_id = item['id']
                article = item['article_data']
                category = article.get('category')
                
                if category:
                    categories_to_create.add(category)
                    article_categories.append({
                        'article_id': article_id,
                        'category_name': category
                    })
            
            # Create categories if they don't exist
            if categories_to_create:
                existing_categories = self.client.table("categories").select("name").execute()
                existing_names = {cat['name'] for cat in existing_categories.data}
                
                new_categories = [
                    {'name': cat} for cat in categories_to_create 
                    if cat not in existing_names
                ]
                
                if new_categories:
                    self.client.table("categories").insert(new_categories).execute()
                    logger.info(f"Created {len(new_categories)} new categories")
            
            # Link articles to categories
            if article_categories:
                # Get category IDs
                all_categories = self.client.table("categories").select("id, name").execute()
                category_map = {cat['name']: cat['id'] for cat in all_categories.data}
                
                article_category_links = []
                for item in article_categories:
                    category_id = category_map.get(item['category_name'])
                    if category_id:
                        article_category_links.append({
                            'article_id': item['article_id'],
                            'category_id': category_id
                        })
                
                if article_category_links:
                    self.client.table("article_categories").insert(article_category_links).execute()
                    logger.info(f"Linked {len(article_category_links)} article-category relationships")
            
        except Exception as e:
            logger.error(f"Error saving categories: {e}")
    
    def check_existing_articles(self, urls: List[str]) -> List[str]:
        """
        Check which URLs already exist in the database.
        
        Args:
            urls: List of article URLs to check
            
        Returns:
            List of URLs that already exist
        """
        try:
            # Query in batches to avoid URL limits
            batch_size = 100
            existing_urls = []
            
            for i in range(0, len(urls), batch_size):
                batch_urls = urls[i:i + batch_size]
                
                result = self.client.table("news_articles").select("url").in_("url", batch_urls).execute()
                
                batch_existing = [row['url'] for row in result.data]
                existing_urls.extend(batch_existing)
            
            logger.info(f"Found {len(existing_urls)} existing URLs out of {len(urls)} checked")
            return existing_urls
            
        except Exception as e:
            logger.error(f"Error checking existing articles: {e}")
            return []
    
    def get_recent_articles(self, hours: int = 24, limit: int = 1000) -> List[Dict]:
        """
        Get recently processed articles.
        
        Args:
            hours: Number of hours back to look
            limit: Maximum number of articles to return
            
        Returns:
            List of recent articles
        """
        try:
            # Calculate timestamp
            from datetime import datetime, timedelta
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            result = self.client.table("news_articles").select("*").gte(
                "scraped_at", cutoff_time.isoformat()
            ).order("scraped_at", desc=True).limit(limit).execute()
            
            logger.info(f"Retrieved {len(result.data)} recent articles")
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting recent articles: {e}")
            return []
    
    def update_article_stats(self, article_id: str, stats: Dict) -> bool:
        """
        Update article statistics (views, likes, etc.).
        
        Args:
            article_id: ID of the article to update
            stats: Dictionary of stats to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.client.table("news_articles").update(stats).eq("id", article_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error updating article stats: {e}")
            return False
    
    def save_pipeline_run_log(self, run_data: Dict) -> str:
        """
        Save pipeline execution log.
        
        Args:
            run_data: Pipeline execution data
            
        Returns:
            Log entry ID
        """
        try:
            log_entry = {
                'run_timestamp': datetime.utcnow().isoformat(),
                'status': run_data.get('status', 'completed'),
                'articles_processed': run_data.get('articles_processed', 0),
                'articles_saved': run_data.get('articles_saved', 0),
                'execution_time': run_data.get('execution_time'),
                'errors': run_data.get('errors', []),
                'metadata': run_data.get('metadata', {})
            }
            
            # Create pipeline_logs table if it doesn't exist
            result = self.client.table("pipeline_logs").insert(log_entry).execute()
            
            return result.data[0]['id'] if result.data else None
            
        except Exception as e:
            logger.error(f"Error saving pipeline log: {e}")
            return None