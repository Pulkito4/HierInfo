"""
News Aggregation & Processing Pipeline
Main orchestrator for the cron job that fetches, processes, and stores news articles.
"""
import logging
import time
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional

# Add app directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Pipeline imports
from pipeline.news_fetcher import NewsFetcher, DEFAULT_RSS_FEEDS
from pipeline.content_scraper import ContentScraper
from pipeline.nlp_processor import NLPProcessor
from pipeline.clustering import ArticleClustering
from pipeline.database_writer import DatabaseWriter

# Model imports
from models.embeddings import EmbeddingModel
from models.summarization import SummarizationModel
from models.categorization import CategoryModel

# Config imports
from config.settings import Settings

# Utility imports
from utils.logging_config import setup_logging

# Set up logging
setup_logging()
logger = logging.getLogger(__name__)

class NewsProcessingPipeline:
    """Main pipeline orchestrator for news processing."""
    
    def __init__(self):
        self.settings = Settings()
        
        # Initialize pipeline components
        self.news_fetcher = NewsFetcher()
        self.content_scraper = ContentScraper(max_workers=5)
        self.nlp_processor = NLPProcessor()
        self.clustering = ArticleClustering()
        self.db_writer = DatabaseWriter()
        
        # Track pipeline execution
        self.start_time = None
        self.stats = {
            'articles_fetched': 0,
            'articles_scraped': 0,
            'articles_processed': 0,
            'articles_saved': 0,
            'errors': []
        }
    
    def run_pipeline(self, 
                    fetch_limit: int = 20, 
                    categories: Optional[List[str]] = None) -> Dict:
        """
        Run the complete news processing pipeline.
        
        Args:
            fetch_limit: Maximum number of articles to fetch
            categories: List of categories to fetch (default: all)
            
        Returns:
            Pipeline execution statistics
        """
        self.start_time = time.time()
        logger.info("=== Starting News Processing Pipeline ===")
        
        try:
            # Step 1: Fetch articles from various sources
            articles = self._fetch_articles(fetch_limit, categories)
            
            if not articles:
                logger.warning("No articles fetched, pipeline terminating")
                return self._get_final_stats("no_articles")
            
            # Step 2: Scrape full content
            articles = self._scrape_content(articles)
            
            # Step 3: Deduplicate articles
            articles = self._deduplicate_articles(articles)
            
            # Step 4: Generate embeddings (do this early for clustering)
            articles = self._generate_embeddings(articles)
            
            # Step 5: Cluster articles for deduplication and event detection
            articles = self._cluster_articles(articles)
            
            # Step 6: Get representative articles from clusters
            articles = self._get_cluster_representatives(articles)
            
            # Step 7: Run NLP processing (categorization, keywords, summarization)
            articles = self._process_with_nlp(articles)
            
            # Step 8: Save to database
            saved_ids = self._save_to_database(articles)
            
            logger.info("=== Pipeline Completed Successfully ===")
            return self._get_final_stats("completed")
            
        except Exception as e:
            logger.error(f"Pipeline failed with error: {e}", exc_info=True)
            self.stats['errors'].append(str(e))
            return self._get_final_stats("failed")
    
    def _fetch_articles(self, fetch_limit: int, categories: Optional[List[str]]) -> List[Dict]:
        """Fetch articles from GNews API and RSS feeds."""
        logger.info("Step 1: Fetching articles from sources")
        
        all_articles = []
        articles_per_category = max(5, fetch_limit // 5)  # Minimum 5 articles per category for testing
        
        # Fetch from GNews API
        try:
            gnews_categories = categories or ['general', 'technology', 'business', 'health', 'sports']
            
            for category in gnews_categories:
                articles = self.news_fetcher.fetch_gnews_articles(
                    category=category, 
                    max_articles=articles_per_category
                )
                all_articles.extend(articles)
                
                if len(all_articles) >= fetch_limit:
                    break
                    
        except Exception as e:
            logger.error(f"Error fetching from GNews: {e}")
            self.stats['errors'].append(f"GNews fetch error: {e}")
        
        # Fetch from RSS feeds
        try:
            rss_articles = self.news_fetcher.fetch_rss_articles(
                rss_urls=sum(DEFAULT_RSS_FEEDS.values(), []),  # Flatten all RSS URLs
                max_per_feed=20
            )
            all_articles.extend(rss_articles)
            
        except Exception as e:
            logger.error(f"Error fetching from RSS: {e}")
            self.stats['errors'].append(f"RSS fetch error: {e}")
        
        self.stats['articles_fetched'] = len(all_articles)
        logger.info(f"Fetched {len(all_articles)} articles total")
        
        return all_articles[:fetch_limit]  # Limit to requested amount
    
    def _scrape_content(self, articles: List[Dict]) -> List[Dict]:
        """Scrape full content for articles."""
        logger.info("Step 2: Scraping full content")
        
        # Filter articles that need scraping
        articles_to_scrape = [
            article for article in articles 
            if not article.get('content') or len(article.get('content', '')) < 100
        ]
        
        logger.info(f"Scraping content for {len(articles_to_scrape)} articles")
        
        if articles_to_scrape:
            scraped_articles = self.content_scraper.scrape_articles(articles_to_scrape)
            
            # Update original articles with scraped content
            scraped_by_url = {article['url']: article for article in scraped_articles}
            
            for article in articles:
                if article['url'] in scraped_by_url:
                    article.update(scraped_by_url[article['url']])
        
        # Count successfully scraped articles
        scraped_count = sum(1 for article in articles if article.get('scraping_success'))
        self.stats['articles_scraped'] = scraped_count
        
        logger.info(f"Successfully scraped content for {scraped_count} articles")
        return articles
    
    def _deduplicate_articles(self, articles: List[Dict]) -> List[Dict]:
        """Remove duplicate articles."""
        logger.info("Step 3: Deduplicating articles")
        
        deduplicated = self.clustering.deduplicate_articles(articles)
        
        removed_count = len(articles) - len(deduplicated)
        logger.info(f"Removed {removed_count} duplicate articles")
        
        return deduplicated
    
    def _generate_embeddings(self, articles: List[Dict]) -> List[Dict]:
        """Generate embeddings for articles."""
        logger.info("Step 4: Generating embeddings")
        
        # Use content for embeddings, fallback to title+description
        for article in articles:
            if not article.get('content'):
                # Create text from title and description
                text_parts = []
                if article.get('title'):
                    text_parts.append(article['title'])
                if article.get('description'):
                    text_parts.append(article['description'])
                article['content'] = '. '.join(text_parts)
        
        articles_with_embeddings = self.nlp_processor.generate_embeddings(articles)
        
        embedding_count = sum(1 for article in articles_with_embeddings if article.get('embedding'))
        logger.info(f"Generated embeddings for {embedding_count} articles")
        
        return articles_with_embeddings
    
    def _cluster_articles(self, articles: List[Dict]) -> List[Dict]:
        """Cluster articles by similarity."""
        logger.info("Step 5: Clustering articles")
        
        clustered_articles = self.clustering.cluster_articles(articles, method='dbscan')
        
        cluster_count = len(set(article.get('cluster_id', -1) for article in clustered_articles))
        logger.info(f"Created {cluster_count} clusters")
        
        return clustered_articles
    
    def _get_cluster_representatives(self, articles: List[Dict]) -> List[Dict]:
        """Get representative articles from clusters."""
        logger.info("Step 6: Selecting cluster representatives")
        
        representatives = self.clustering.get_cluster_representatives(articles)
        
        logger.info(f"Selected {len(representatives)} representative articles")
        return representatives
    
    def _process_with_nlp(self, articles: List[Dict]) -> List[Dict]:
        """Run NLP processing on articles."""
        logger.info("Step 7: Running NLP processing")
        
        # Categorize articles
        articles = self.nlp_processor.categorize_articles(articles)
        
        # Extract keywords
        articles = self.nlp_processor.extract_keywords(articles)
        
        # Generate summaries
        articles = self.nlp_processor.summarize_articles(articles)
        
        self.stats['articles_processed'] = len(articles)
        logger.info(f"Completed NLP processing for {len(articles)} articles")
        
        return articles
    
    def _save_to_database(self, articles: List[Dict]) -> List[str]:
        """Save processed articles to database."""
        logger.info("Step 8: Saving to database")
        
        # Check for existing articles
        urls = [article['url'] for article in articles]
        existing_urls = self.db_writer.check_existing_articles(urls)
        
        # Filter out existing articles
        new_articles = [
            article for article in articles 
            if article['url'] not in existing_urls
        ]
        
        logger.info(f"Saving {len(new_articles)} new articles (filtered {len(existing_urls)} existing)")
        
        if new_articles:
            saved_ids = self.db_writer.save_articles(new_articles)
            self.stats['articles_saved'] = len(saved_ids)
        else:
            saved_ids = []
            self.stats['articles_saved'] = 0
        
        # Save pipeline run log
        self._save_pipeline_log()
        
        return saved_ids
    
    def _save_pipeline_log(self):
        """Save pipeline execution log."""
        try:
            execution_time = time.time() - self.start_time if self.start_time else 0
            
            log_data = {
                'status': 'completed' if not self.stats['errors'] else 'completed_with_errors',
                'articles_processed': self.stats['articles_processed'],
                'articles_saved': self.stats['articles_saved'],
                'execution_time': execution_time,
                'errors': self.stats['errors'],
                'metadata': {
                    'articles_fetched': self.stats['articles_fetched'],
                    'articles_scraped': self.stats['articles_scraped'],
                    'pipeline_version': '1.0.0'
                }
            }
            
            log_id = self.db_writer.save_pipeline_run_log(log_data)
            logger.info(f"Saved pipeline log with ID: {log_id}")
            
        except Exception as e:
            logger.error(f"Failed to save pipeline log: {e}")
    
    def _get_final_stats(self, status: str) -> Dict:
        """Get final pipeline statistics."""
        execution_time = time.time() - self.start_time if self.start_time else 0
        
        return {
            'status': status,
            'execution_time': execution_time,
            'timestamp': datetime.utcnow().isoformat(),
            'stats': self.stats
        }


def main():
    """Main entry point for the pipeline."""
    pipeline = NewsProcessingPipeline()
    
    # 🧪 TESTING MODE: Limited articles to avoid API limits
    result = pipeline.run_pipeline(
        fetch_limit=15,  # Only fetch 15 articles total for testing
        categories=['technology', 'business']  # Only test with 2 categories
    )
    
    logger.info(f"Pipeline completed with status: {result['status']}")
    logger.info(f"Execution time: {result['execution_time']:.2f} seconds")
    logger.info(f"Statistics: {result['stats']}")


if __name__ == "__main__":
    main()