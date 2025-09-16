"""
News fetching functions - simple and clean.
"""

import logging
import requests
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def fetch_gnews_articles(
    category: str = "technology", max_articles: int = 10
) -> List[Dict]:
    """
    Fetch news articles from GNews API.

    Args:
        category: News category to fetch
        max_articles: Maximum number of articles to fetch

    Returns:
        List of article dictionaries
    """
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        logger.error("GNews API key not found")
        return []

    try:
        url = "https://gnews.io/api/v4/top-headlines"
        params = {
            "category": category,
            "lang": "en",
            "country": "us",
            "max": min(max_articles, 100),  # GNews limit
            "apikey": api_key,
        }

        logger.info(
            f"Fetching {max_articles} articles from GNews (category: {category})"
        )
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        articles = data.get("articles", [])

        # Clean and standardize article format
        cleaned_articles = []
        for article in articles:
            cleaned_article = {
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "url": article.get("url", ""),
                "image_url": article.get("image"),
                "published_at": article.get("publishedAt"),
                "source_name": article.get("source", {}).get("name", "Unknown"),
                "content": article.get("content", ""),  # May be truncated
            }
            cleaned_articles.append(cleaned_article)

        logger.info(f"Successfully fetched {len(cleaned_articles)} articles from GNews")
        return cleaned_articles

    except requests.RequestException as e:
        logger.error(f"Error fetching from GNews: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in GNews fetch: {e}")
        return []


def fetch_all_news_sources(max_articles: int = 50) -> List[Dict]:
    """
    Fetch news from all configured sources.

    Args:
        max_articles: Total maximum articles across all sources

    Returns:
        Combined list of articles from all sources
    """
    logger.info(f"Fetching up to {max_articles} articles from all sources")

    all_articles = []

    # Fetch from GNews (primary source)
    gnews_articles = fetch_gnews_articles(
        category="technology", max_articles=max_articles
    )
    all_articles.extend(gnews_articles)

    # Add more sources here in the future:
    # newsapi_articles = fetch_newsapi_articles(max_articles=max_articles//2)
    # reddit_articles = fetch_reddit_posts(max_articles=max_articles//4)

    logger.info(f"Total articles fetched: {len(all_articles)}")
    return all_articles[:max_articles]  # Ensure we don't exceed limit


def check_article_urls(urls: List[str]) -> List[str]:
    """
    Check which URLs are accessible.

    Args:
        urls: List of article URLs to check

    Returns:
        List of accessible URLs
    """
    accessible_urls = []

    for url in urls:
        try:
            response = requests.head(url, timeout=10, allow_redirects=True)
            if response.status_code == 200:
                accessible_urls.append(url)
        except:
            continue  # Skip inaccessible URLs

    logger.info(f"Found {len(accessible_urls)} accessible URLs out of {len(urls)}")
    return accessible_urls
