"""Content scraping module for extracting full article content."""
import logging
from typing import List, Dict, Optional
from newspaper import Article, Config
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

logger = logging.getLogger(__name__)

class ContentScraper:
    """Scrapes full content from article URLs using newspaper3k."""
    
    def __init__(self, max_workers: int = 5):
        self.max_workers = max_workers
        self.config = Config()
        self.config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        self.config.request_timeout = 10
        self.config.number_threads = 1  # Per article
        
        # Rate limiting
        self._last_request_time = {}
        self._lock = threading.Lock()
    
    def scrape_articles(self, articles: List[Dict]) -> List[Dict]:
        """
        Scrape full content for a list of articles.
        
        Args:
            articles: List of article dictionaries with 'url' field
            
        Returns:
            List of articles with scraped content
        """
        logger.info(f"Starting content scraping for {len(articles)} articles")
        
        scraped_articles = []
        
        # Use ThreadPoolExecutor for concurrent scraping
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all scraping tasks
            future_to_article = {
                executor.submit(self._scrape_single_article, article): article 
                for article in articles
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_article):
                original_article = future_to_article[future]
                try:
                    scraped_article = future.result()
                    if scraped_article:
                        scraped_articles.append(scraped_article)
                    else:
                        # Keep original if scraping failed
                        scraped_articles.append(original_article)
                except Exception as e:
                    logger.error(f"Error scraping article {original_article.get('url', 'unknown')}: {e}")
                    scraped_articles.append(original_article)
        
        logger.info(f"Completed scraping. Successfully scraped {len([a for a in scraped_articles if a.get('scraped_content')])} articles")
        return scraped_articles
    
    def _scrape_single_article(self, article: Dict) -> Optional[Dict]:
        """
        Scrape content for a single article.
        
        Args:
            article: Article dictionary with 'url' field
            
        Returns:
            Article dictionary with scraped content
        """
        url = article.get('url')
        if not url:
            return article
            
        try:
            # Rate limiting per domain
            self._rate_limit(url)
            
            # Create newspaper Article object
            news_article = Article(url, config=self.config)
            
            # Download and parse
            news_article.download()
            news_article.parse()
            
            # Extract additional metadata
            news_article.nlp()  # This might take time, consider making optional
            
            # Update article with scraped content
            scraped_article = article.copy()
            scraped_article.update({
                'scraped_content': news_article.text,
                'scraped_title': news_article.title,
                'scraped_authors': news_article.authors,
                'scraped_publish_date': news_article.publish_date,
                'scraped_keywords': news_article.keywords,
                'scraped_summary': news_article.summary,
                'scraped_image': news_article.top_image,
                'scraped_videos': news_article.movies,
                'scraping_success': True,
                'scraped_at': time.time()
            })
            
            # Use scraped content if original is empty or too short
            if not article.get('content') or len(article.get('content', '')) < 100:
                scraped_article['content'] = news_article.text
                
            # Use scraped title if original is missing
            if not article.get('title'):
                scraped_article['title'] = news_article.title
                
            return scraped_article
            
        except Exception as e:
            logger.warning(f"Failed to scrape {url}: {e}")
            # Return original article with error info
            error_article = article.copy()
            error_article.update({
                'scraping_success': False,
                'scraping_error': str(e),
                'scraped_at': time.time()
            })
            return error_article
    
    def _rate_limit(self, url: str):
        """Apply rate limiting per domain."""
        try:
            domain = requests.utils.urlparse(url).netloc
            
            with self._lock:
                now = time.time()
                last_time = self._last_request_time.get(domain, 0)
                
                # Wait at least 1 second between requests to same domain
                if now - last_time < 1.0:
                    time.sleep(1.0 - (now - last_time))
                
                self._last_request_time[domain] = time.time()
                
        except Exception as e:
            logger.warning(f"Error in rate limiting for {url}: {e}")
            # Default delay if URL parsing fails
            time.sleep(0.5)
    
    def validate_content(self, article: Dict) -> bool:
        """
        Validate if scraped content is useful.
        
        Args:
            article: Article with scraped content
            
        Returns:
            True if content is valid and useful
        """
        content = article.get('scraped_content') or article.get('content', '')
        
        if not content:
            return False
            
        # Minimum content length
        if len(content.strip()) < 100:
            return False
            
        # Check for common error indicators
        error_indicators = [
            '404 not found',
            'page not found',
            'access denied',
            'please enable javascript',
            'subscription required'
        ]
        
        content_lower = content.lower()
        for indicator in error_indicators:
            if indicator in content_lower:
                return False
                
        return True
    
    def clean_content(self, content: str) -> str:
        """
        Clean scraped content by removing common noise.
        
        Args:
            content: Raw scraped content
            
        Returns:
            Cleaned content
        """
        if not content:
            return ""
            
        # Remove extra whitespace
        content = ' '.join(content.split())
        
        # Remove common footer/header text patterns
        noise_patterns = [
            r'Subscribe to our newsletter.*',
            r'Follow us on.*',
            r'Advertisement.*',
            r'Related Articles.*'
        ]
        
        import re
        for pattern in noise_patterns:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)
        
        return content.strip()