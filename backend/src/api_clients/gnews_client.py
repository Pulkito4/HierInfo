import os
import time
import requests
from typing import List, Dict, Any

# Assuming a central logging config in main.py, or you can use your own.
from logging import getLogger
from src.scrapers.content_scraper import parse_articles_batch

logger = getLogger(__name__)

# fetches article metadata
def _fetch_raw_articles_from_gnews(
    api_key: str,
    max_articles: int = 100,
    category: str = "world",
    country: str = "in",
    language: str = "en",
    retry_attempts: int = 3,
    timeout: int = 30
) -> List[Dict]:
    """
    (Internal) Fetches raw article metadata from GNews API with production-grade error handling.
    This is your original, robust function, now marked as internal to the client.
    """
    logger.info(f"🚀 Starting GNews API fetch - Target: {max_articles} articles")
    logger.debug(f"Parameters: category={category}, country={country}, lang={language}")

    url = "https://gnews.io/api/v4/top-headlines"
    params = {
        'category': category,
        'country': country,
        'lang': language,
        'max': min(max_articles, 100),
        'apikey': api_key
    }

    last_exception = None
    for attempt in range(retry_attempts):
        try:
            response = requests.get(url, params=params, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            articles = data.get('articles', [])
            logger.info(f"✅ Successfully fetched metadata for {len(articles)} articles from GNews API")
            return articles
        except requests.exceptions.RequestException as e:
            logger.warning(f"🌐 Network error on attempt {attempt + 1}: {e}")
            last_exception = e
            time.sleep(2 ** attempt) # Exponential backoff

    logger.error(f"❌ Failed to fetch from GNews after {retry_attempts} attempts. Last error: {last_exception}")
    return []

def fetch_and_process_gnews_articles(
    max_articles: int = 100,
    category: str = "world",
    country: str = "in"
) -> List[Dict[str, Any]]:
    """
    The main public function for this client. It fetches, scrapes, and formats articles.

    This function orchestrates the entire process:
    1. Fetches raw article metadata using your robust, retry-enabled function.
    2. Batch scrapes the content from the article URLs.
    3. Merges the metadata and scraped content into the final, standardized format.
    """
    logger.info(f"🎬 Starting full GNews processing for category '{category}'...")
    
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        logger.error("❌ CRITICAL: GNEWS_API_KEY not found in environment variables.")
        raise ValueError("GNEWS_API_KEY is not set.")

    # 1. Fetch raw metadata
    raw_gnews_articles = _fetch_raw_articles_from_gnews(
        api_key=api_key,
        max_articles=max_articles,
        category=category,
        country=country
    )

    if not raw_gnews_articles:
        logger.warning("No articles returned from GNews API. Ending process.")
        return []

    # 2. Scrape content in a batch
    urls_to_scrape = [article['url'] for article in raw_gnews_articles]
    scraped_content_list = parse_articles_batch(urls_to_scrape, max_workers=5)
    scraped_content_map = {content['url']: content for content in scraped_content_list}

    # 3. Merge metadata with scraped content
    processed_articles = []
    for gnews_article in raw_gnews_articles:
        url = gnews_article['url']
        if url in scraped_content_map:
            parsed_content = scraped_content_map[url]
            article_data = {
                'url': url,
                'title': parsed_content.get('title') or gnews_article.get('title', ''),
                'source_name': gnews_article.get('source', {}).get('name', ''),
                'published_at': gnews_article.get('publishedAt'),
                'image_url': parsed_content.get('image_url') or gnews_article.get('image', ''),
                'raw_content': parsed_content.get('text', ''),
                'summary': '',
                'embedding': None,
                'categories': [],
                'keywords': [],
                'trending_score': 0,
                'is_critical': False,
                'source_type': 'gnews_api',
                'parsing_method': parsed_content.get('method', 'none')
            }
            processed_articles.append(article_data)
        else:
            logger.warning(f"⚠️ Skipping article, failed to scrape content for: {url}")

    logger.info(f"✅ GNews client finished. Successfully processed {len(processed_articles)} articles.")
    return processed_articles