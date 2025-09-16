"""
Simplified Supabase database functions.
"""

import logging
from typing import List, Dict, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class SupabaseManager:
    """Simple helper class for Supabase operations."""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")

        self.client: Client = create_client(self.supabase_url, self.supabase_key)

    def test_connection(self) -> bool:
        """Test database connection."""
        try:
            result = self.client.table("test_connection").select("*").limit(1).execute()
            logger.info("✅ Supabase connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase connection failed: {e}")
            return False


# Global instance
_supabase_manager = None


def get_supabase_manager() -> SupabaseManager:
    """Get or create Supabase manager instance."""
    global _supabase_manager
    if _supabase_manager is None:
        _supabase_manager = SupabaseManager()
    return _supabase_manager


def save_articles_to_database(articles: List[Dict]) -> List[str]:
    """
    Save articles to the database with embeddings and categories.

    Args:
        articles: List of processed article dictionaries

    Returns:
        List of saved article IDs
    """
    if not articles:
        return []

    supabase = get_supabase_manager()
    logger.info(f"Saving {len(articles)} articles to database")

    try:
        # Step 1: Prepare articles for main table
        articles_for_db = []
        for article in articles:
            article_data = {
                "title": article.get("title", "")[:500],  # Limit title length
                "summary": article.get("summary", ""),
                "url": article.get("url", ""),
                "source": article.get("source_name", "GNews"),
                "image_url": article.get("image_url") or article.get("scraped_image"),
                "published_at": _format_datetime(article.get("published_at")),
                "trending_score": int(
                    article.get("trending_score", 0.5) * 100
                ),  # Convert to integer
                "is_critical": article.get("is_critical", False),
            }
            articles_for_db.append(article_data)

        # Step 2: Insert articles
        result = (
            supabase.client.table("news_articles").insert(articles_for_db).execute()
        )

        if not result.data:
            logger.error("Failed to insert articles - no data returned")
            return []

        saved_articles = result.data
        saved_ids = [article["id"] for article in saved_articles]

        logger.info(f"✅ Saved {len(saved_ids)} articles to news_articles table")

        # Step 3: Save embeddings
        _save_embeddings(supabase, saved_articles, articles)

        # Step 4: Save categories
        _save_categories(supabase, saved_articles, articles)

        logger.info(
            f"✅ Complete save operation finished for {len(saved_ids)} articles"
        )
        return saved_ids

    except Exception as e:
        logger.error(f"❌ Error saving articles to database: {e}")
        return []


def _save_embeddings(
    supabase: SupabaseManager, saved_articles: List[Dict], original_articles: List[Dict]
) -> None:
    """Save embeddings to news_embeddings table."""
    try:
        embeddings_to_save = []

        for i, saved_article in enumerate(saved_articles):
            if i < len(original_articles):
                original = original_articles[i]
                embedding = original.get("embedding")

                if embedding and isinstance(embedding, list):
                    embeddings_to_save.append(
                        {"article_id": saved_article["id"], "embedding": embedding}
                    )

        if embeddings_to_save:
            supabase.client.table("news_embeddings").insert(
                embeddings_to_save
            ).execute()
            logger.info(f"✅ Saved {len(embeddings_to_save)} embeddings")

    except Exception as e:
        logger.error(f"❌ Error saving embeddings: {e}")


def _save_categories(
    supabase: SupabaseManager, saved_articles: List[Dict], original_articles: List[Dict]
) -> None:
    """Save categories and article-category relationships."""
    try:
        # Collect all categories
        categories_to_create = set()
        article_categories = []

        for i, saved_article in enumerate(saved_articles):
            if i < len(original_articles):
                original = original_articles[i]
                category = original.get("category")

                if category:
                    categories_to_create.add(category)
                    article_categories.append(
                        {"article_id": saved_article["id"], "category_name": category}
                    )

        if not categories_to_create:
            return

        # Step 1: Ensure categories exist
        existing_categories = (
            supabase.client.table("categories").select("name").execute()
        )
        existing_names = {cat["name"] for cat in existing_categories.data}

        new_categories = [
            {"name": cat} for cat in categories_to_create if cat not in existing_names
        ]

        if new_categories:
            supabase.client.table("categories").insert(new_categories).execute()
            logger.info(f"✅ Created {len(new_categories)} new categories")

        # Step 2: Link articles to categories
        if article_categories:
            # Get all category IDs
            all_categories = (
                supabase.client.table("categories").select("id, name").execute()
            )
            category_map = {cat["name"]: cat["id"] for cat in all_categories.data}

            # Create article-category links
            article_category_links = []
            for item in article_categories:
                category_id = category_map.get(item["category_name"])
                if category_id:
                    article_category_links.append(
                        {"article_id": item["article_id"], "category_id": category_id}
                    )

            if article_category_links:
                supabase.client.table("article_categories").insert(
                    article_category_links
                ).execute()
                logger.info(
                    f"✅ Linked {len(article_category_links)} article-category relationships"
                )

    except Exception as e:
        logger.error(f"❌ Error saving categories: {e}")


def _format_datetime(dt) -> Optional[str]:
    """Format datetime for database insertion."""
    if dt is None:
        return None

    if isinstance(dt, str):
        return dt

    if hasattr(dt, "isoformat"):
        return dt.isoformat()

    return None


def check_existing_urls(urls: List[str]) -> List[str]:
    """
    Check which URLs already exist in the database.

    Args:
        urls: List of URLs to check

    Returns:
        List of existing URLs
    """
    if not urls:
        return []

    try:
        supabase = get_supabase_manager()

        # Query in batches to avoid URL limits
        existing_urls = []
        batch_size = 100

        for i in range(0, len(urls), batch_size):
            batch_urls = urls[i : i + batch_size]
            result = (
                supabase.client.table("news_articles")
                .select("url")
                .in_("url", batch_urls)
                .execute()
            )
            batch_existing = [row["url"] for row in result.data]
            existing_urls.extend(batch_existing)

        logger.info(
            f"Found {len(existing_urls)} existing URLs out of {len(urls)} checked"
        )
        return existing_urls

    except Exception as e:
        logger.error(f"Error checking existing URLs: {e}")
        return []


def get_recent_articles(hours: int = 24) -> List[Dict]:
    """
    Get recently saved articles from the database.

    Args:
        hours: Hours back to look

    Returns:
        List of recent articles
    """
    try:
        supabase = get_supabase_manager()

        # Calculate timestamp
        from datetime import datetime, timedelta

        cutoff_time = (datetime.now() - timedelta(hours=hours)).isoformat()

        result = (
            supabase.client.table("news_articles")
            .select("*")
            .gte("created_at", cutoff_time)
            .order("created_at", desc=True)
            .execute()
        )

        logger.info(f"Retrieved {len(result.data)} recent articles")
        return result.data

    except Exception as e:
        logger.error(f"Error getting recent articles: {e}")
        return []
