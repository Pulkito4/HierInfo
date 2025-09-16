"""
Content scraping functions using newspaper3k.
"""

import logging
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from newspaper import Article
import time

logger = logging.getLogger(__name__)


def scrape_single_article(article_dict: Dict) -> Optional[Dict]:
    """
    Scrape content for a single article.

    Args:
        article_dict: Article dictionary with 'url' field

    Returns:
        Article with scraped content or None if failed
    """
    url = article_dict.get("url")
    if not url:
        return None

    try:
        # Create newspaper Article object
        article = Article(url)
        article.download()
        article.parse()

        # Extract content
        if article.text and len(article.text.strip()) > 100:
            scraped_data = article_dict.copy()
            scraped_data.update(
                {
                    "content": article.text,
                    "scraped_image": article.top_image,
                    "scraped_title": article.title,
                    "scraped_authors": article.authors,
                    "scraped_publish_date": article.publish_date,
                    "scraping_success": True,
                }
            )
            return scraped_data

        return None

    except Exception as e:
        logger.warning(f"Failed to scrape {url}: {e}")
        return None


def scrape_articles_content(articles: List[Dict], max_workers: int = 5) -> List[Dict]:
    """
    Scrape content for multiple articles concurrently.

    Args:
        articles: List of article dictionaries
        max_workers: Number of concurrent scraping threads

    Returns:
        List of articles with scraped content
    """
    logger.info(
        f"Scraping content for {len(articles)} articles with {max_workers} workers"
    )

    scraped_articles = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all scraping tasks
        future_to_article = {
            executor.submit(scrape_single_article, article): article
            for article in articles
        }

        # Collect results
        for future in as_completed(future_to_article):
            try:
                scraped_article = future.result()
                if scraped_article:
                    scraped_articles.append(scraped_article)
            except Exception as e:
                logger.warning(f"Error in scraping task: {e}")
                continue

            # Rate limiting
            time.sleep(0.1)

    logger.info(f"Successfully scraped {len(scraped_articles)} articles")
    return scraped_articles


def filter_articles_by_content(
    articles: List[Dict], min_content_length: int = 200
) -> List[Dict]:
    """
    Filter articles that have sufficient content.

    Args:
        articles: List of article dictionaries
        min_content_length: Minimum content length required

    Returns:
        Filtered list of articles
    """
    filtered_articles = []

    for article in articles:
        content = article.get("content", "")
        if content and len(content.strip()) >= min_content_length:
            filtered_articles.append(article)

    logger.info(
        f"Filtered to {len(filtered_articles)} articles with sufficient content"
    )
    return filtered_articles
