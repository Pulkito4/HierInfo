"""Article clustering module for deduplication and event detection."""
import logging
from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import hashlib

logger = logging.getLogger(__name__)

class ArticleClustering:
    """Handles article clustering for deduplication and event detection."""
    
    def __init__(self):
        self.similarity_threshold = 0.8  # For semantic deduplication
        self.cluster_min_samples = 2     # DBSCAN parameter
        self.cluster_eps = 0.3          # DBSCAN parameter
    
    def cluster_articles(self, articles: List[Dict], method: str = 'dbscan') -> List[Dict]:
        """
        Cluster articles by semantic similarity.
        
        Args:
            articles: List of articles with embeddings
            method: Clustering method ('dbscan', 'kmeans', or 'similarity')
            
        Returns:
            Articles with cluster information added
        """
        logger.info(f"Clustering {len(articles)} articles using {method}")
        
        # Filter articles with embeddings
        articles_with_embeddings = [
            article for article in articles 
            if article.get('embedding') is not None
        ]
        
        if len(articles_with_embeddings) < 2:
            logger.warning("Not enough articles with embeddings for clustering")
            for article in articles:
                article['cluster_id'] = 0
                article['cluster_size'] = len(articles)
            return articles
        
        # Extract embeddings
        embeddings = np.array([
            article['embedding'] for article in articles_with_embeddings
        ])
        
        # Perform clustering
        if method == 'dbscan':
            cluster_labels = self._cluster_dbscan(embeddings)
        elif method == 'kmeans':
            cluster_labels = self._cluster_kmeans(embeddings)
        else:  # similarity-based
            cluster_labels = self._cluster_by_similarity(embeddings)
        
        # Assign cluster information
        cluster_counter = defaultdict(int)
        for i, article in enumerate(articles_with_embeddings):
            cluster_id = cluster_labels[i]
            article['cluster_id'] = int(cluster_id)
            cluster_counter[cluster_id] += 1
        
        # Add cluster sizes
        for article in articles_with_embeddings:
            cluster_id = article['cluster_id']
            article['cluster_size'] = cluster_counter[cluster_id]
        
        # Handle articles without embeddings
        for article in articles:
            if article.get('embedding') is None:
                article['cluster_id'] = -1
                article['cluster_size'] = 1
        
        logger.info(f"Created {len(set(cluster_labels))} clusters")
        return articles
    
    def _cluster_dbscan(self, embeddings: np.ndarray) -> np.ndarray:
        """Cluster using DBSCAN algorithm."""
        clustering = DBSCAN(
            eps=self.cluster_eps,
            min_samples=self.cluster_min_samples,
            metric='cosine'
        )
        return clustering.fit_predict(embeddings)
    
    def _cluster_kmeans(self, embeddings: np.ndarray, 
                       n_clusters: Optional[int] = None) -> np.ndarray:
        """Cluster using K-means algorithm."""
        if n_clusters is None:
            # Estimate number of clusters (rough heuristic)
            n_clusters = min(max(len(embeddings) // 10, 2), 50)
        
        clustering = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        return clustering.fit_predict(embeddings)
    
    def _cluster_by_similarity(self, embeddings: np.ndarray) -> np.ndarray:
        """Cluster based on cosine similarity threshold."""
        similarity_matrix = cosine_similarity(embeddings)
        
        # Create clusters based on similarity threshold
        clusters = []
        assigned = set()
        
        for i in range(len(embeddings)):
            if i in assigned:
                continue
                
            # Find all similar articles
            similar_indices = np.where(similarity_matrix[i] >= self.similarity_threshold)[0]
            
            # Create new cluster
            cluster_members = [idx for idx in similar_indices if idx not in assigned]
            if cluster_members:
                clusters.append(cluster_members)
                assigned.update(cluster_members)
        
        # Assign cluster labels
        labels = np.full(len(embeddings), -1)
        for cluster_id, members in enumerate(clusters):
            for member in members:
                labels[member] = cluster_id
        
        return labels
    
    def deduplicate_articles(self, articles: List[Dict]) -> List[Dict]:
        """
        Remove duplicate articles based on multiple criteria.
        
        Args:
            articles: List of articles
            
        Returns:
            Deduplicated list of articles
        """
        logger.info(f"Deduplicating {len(articles)} articles")
        
        # First pass: Remove exact URL duplicates
        seen_urls = set()
        url_deduped = []
        
        for article in articles:
            url = article.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                url_deduped.append(article)
        
        logger.info(f"Removed {len(articles) - len(url_deduped)} URL duplicates")
        
        # Second pass: Remove articles with identical titles
        seen_titles = set()
        title_deduped = []
        
        for article in url_deduped:
            title = article.get('title', '').strip().lower()
            title_hash = hashlib.md5(title.encode()).hexdigest()
            
            if title and title_hash not in seen_titles:
                seen_titles.add(title_hash)
                title_deduped.append(article)
        
        logger.info(f"Removed {len(url_deduped) - len(title_deduped)} title duplicates")
        
        # Third pass: Semantic deduplication using embeddings
        semantic_deduped = self._semantic_deduplication(title_deduped)
        
        logger.info(f"Final count after deduplication: {len(semantic_deduped)}")
        return semantic_deduped
    
    def _semantic_deduplication(self, articles: List[Dict]) -> List[Dict]:
        """Remove semantically similar articles."""
        articles_with_embeddings = [
            article for article in articles 
            if article.get('embedding') is not None
        ]
        
        if len(articles_with_embeddings) < 2:
            return articles
        
        embeddings = np.array([
            article['embedding'] for article in articles_with_embeddings
        ])
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Find duplicates
        to_remove = set()
        for i in range(len(embeddings)):
            if i in to_remove:
                continue
                
            for j in range(i + 1, len(embeddings)):
                if j in to_remove:
                    continue
                    
                if similarity_matrix[i][j] >= self.similarity_threshold:
                    # Keep the article with more content or better metadata
                    article_i = articles_with_embeddings[i]
                    article_j = articles_with_embeddings[j]
                    
                    if self._should_keep_first(article_i, article_j):
                        to_remove.add(j)
                    else:
                        to_remove.add(i)
                        break
        
        # Remove duplicates
        deduplicated = [
            article for i, article in enumerate(articles_with_embeddings)
            if i not in to_remove
        ]
        
        # Add back articles without embeddings
        articles_without_embeddings = [
            article for article in articles 
            if article.get('embedding') is None
        ]
        deduplicated.extend(articles_without_embeddings)
        
        logger.info(f"Removed {len(articles_with_embeddings) - len(deduplicated) + len(articles_without_embeddings)} semantic duplicates")
        return deduplicated
    
    def _should_keep_first(self, article1: Dict, article2: Dict) -> bool:
        """Decide which article to keep when deduplicating."""
        # Prefer article with more content
        content1_len = len(article1.get('content', '') or article1.get('scraped_content', ''))
        content2_len = len(article2.get('content', '') or article2.get('scraped_content', ''))
        
        if content1_len != content2_len:
            return content1_len > content2_len
        
        # Prefer article with more complete metadata
        metadata_score1 = sum([
            1 for field in ['title', 'description', 'source_name', 'published_at']
            if article1.get(field)
        ])
        metadata_score2 = sum([
            1 for field in ['title', 'description', 'source_name', 'published_at']
            if article2.get(field)
        ])
        
        if metadata_score1 != metadata_score2:
            return metadata_score1 > metadata_score2
        
        # Default to first article
        return True
    
    def get_cluster_representatives(self, articles: List[Dict]) -> List[Dict]:
        """
        Get representative articles from each cluster.
        
        Args:
            articles: Clustered articles
            
        Returns:
            List of representative articles
        """
        clusters = defaultdict(list)
        
        # Group articles by cluster
        for article in articles:
            cluster_id = article.get('cluster_id', -1)
            clusters[cluster_id].append(article)
        
        representatives = []
        
        for cluster_id, cluster_articles in clusters.items():
            if cluster_id == -1:  # Noise cluster
                representatives.extend(cluster_articles)
            else:
                # Select best representative from cluster
                representative = self._select_cluster_representative(cluster_articles)
                representatives.append(representative)
        
        logger.info(f"Selected {len(representatives)} representative articles from {len(clusters)} clusters")
        return representatives
    
    def _select_cluster_representative(self, cluster_articles: List[Dict]) -> Dict:
        """Select the best representative article from a cluster."""
        if len(cluster_articles) == 1:
            return cluster_articles[0]
        
        # Score articles based on multiple factors
        best_article = None
        best_score = -1
        
        for article in cluster_articles:
            score = 0
            
            # Content length (normalized)
            content_len = len(article.get('content', '') or article.get('scraped_content', ''))
            score += min(content_len / 1000, 1.0) * 0.3
            
            # Metadata completeness
            metadata_fields = ['title', 'description', 'source_name', 'published_at', 'image_url']
            metadata_score = sum(1 for field in metadata_fields if article.get(field))
            score += (metadata_score / len(metadata_fields)) * 0.2
            
            # Source reliability (simple heuristic)
            source_name = article.get('source_name', '').lower()
            reliable_sources = ['reuters', 'bbc', 'cnn', 'ap news', 'associated press']
            if any(source in source_name for source in reliable_sources):
                score += 0.2
            
            # Recency (if published_at is available)
            if article.get('published_at'):
                score += 0.1
            
            # Successful scraping
            if article.get('scraping_success'):
                score += 0.2
            
            if score > best_score:
                best_score = score
                best_article = article
        
        return best_article or cluster_articles[0]