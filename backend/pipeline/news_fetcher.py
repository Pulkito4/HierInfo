"""News fetching module for aggregating articles from various sources."""
import requests
import feedparser
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class NewsFetcher:
    """Handles fetching news articles from various sources."""
    
    def __init__(self):
        self.gnews_api_key = os.getenv("GNEWS_API_KEY")
        self.gnews_base_url = "https://gnews.io/api/v4"
        
    def fetch_gnews_articles(self, category: str = "general", max_articles: int = 10) -> List[Dict]:
        """
        Fetch articles from GNews API.
        
        Args:
            category: News category (general, world, nation, business, technology, etc.)
            max_articles: Maximum number of articles to fetch (default limited to 10 for testing)
            
        Returns:
            List of article dictionaries
        """
        if not self.gnews_api_key:
            logger.error("GNews API key not found")
            return []
            
        url = f"{self.gnews_base_url}/top-headlines"
        params = {
            'apikey': self.gnews_api_key,
            'category': category,
            'lang': 'en',
            'country': 'us',
            'max': min(max_articles, 100)  # GNews API limit
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            articles = data.get('articles', [])
            
            logger.info(f"Fetched {len(articles)} articles from GNews for category: {category}")
            return self._normalize_gnews_articles(articles)
            
        except requests.RequestException as e:
            logger.error(f"Error fetching from GNews API: {e}")
            return []
    
    def fetch_rss_articles(self, rss_urls: List[str], max_per_feed: int = 50) -> List[Dict]:
        """
        Fetch articles from RSS feeds.
        
        Args:
            rss_urls: List of RSS feed URLs
            max_per_feed: Maximum articles per feed
            
        Returns:
            List of article dictionaries
        """
        all_articles = []
        
        for url in rss_urls:
            try:
                feed = feedparser.parse(url)
                
                if feed.bozo:
                    logger.warning(f"RSS feed may have issues: {url}")
                
                entries = feed.entries[:max_per_feed]
                articles = self._normalize_rss_articles(entries, url)
                all_articles.extend(articles)
                
                logger.info(f"Fetched {len(articles)} articles from RSS: {url}")
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error fetching RSS feed {url}: {e}")
                continue
                
        return all_articles
    
    def _normalize_gnews_articles(self, articles: List[Dict]) -> List[Dict]:
        """Normalize GNews articles to standard format."""
        normalized = []
        
        for article in articles:
            normalized_article = {
                'source': 'gnews',
                'source_name': article.get('source', {}).get('name', 'Unknown'),
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'url': article.get('url', ''),
                'published_at': self._parse_datetime(article.get('publishedAt')),
                'image_url': article.get('image'),
                'content': article.get('content', ''),  # Usually truncated
                'raw_data': article
            }
            normalized.append(normalized_article)
            
        return normalized
    
    def _normalize_rss_articles(self, entries: List, source_url: str) -> List[Dict]:
        """Normalize RSS articles to standard format."""
        normalized = []
        
        for entry in entries:
            # Extract source name from RSS feed
            source_name = getattr(entry, 'source', {}).get('title', 'RSS Feed')
            
            normalized_article = {
                'source': 'rss',
                'source_name': source_name,
                'source_url': source_url,
                'title': entry.get('title', ''),
                'description': entry.get('description', '') or entry.get('summary', ''),
                'url': entry.get('link', ''),
                'published_at': self._parse_datetime(entry.get('published')),
                'content': entry.get('content', [{}])[0].get('value', '') if entry.get('content') else '',
                'raw_data': dict(entry)
            }
            normalized.append(normalized_article)
            
        return normalized
    
    def _parse_datetime(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse various datetime formats."""
        if not date_str:
            return None
            
        # Common formats
        formats = [
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%d %H:%M:%S',
            '%a, %d %b %Y %H:%M:%S %Z',
            '%a, %d %b %Y %H:%M:%S %z'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
                
        logger.warning(f"Could not parse datetime: {date_str}")
        return None

# Default RSS feeds for different categories
DEFAULT_RSS_FEEDS = {
    'technology': [
        'https://feeds.feedburner.com/TechCrunch',
        'https://www.wired.com/feed/rss',
        'https://feeds.arstechnica.com/arstechnica/index'
    ],
    'business': [
        'https://feeds.bloomberg.com/markets/news.rss',
        'https://feeds.reuters.com/reuters/businessNews'
    ],
    'world': [
        'https://feeds.bbci.co.uk/news/world/rss.xml',
        'https://feeds.reuters.com/Reuters/worldNews'
    ]
}