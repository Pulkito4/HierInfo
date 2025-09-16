"""
Main pipeline script - Clean functional architecture for news aggregation.

This script orchestrates the complete news processing pipeline using
simple function calls instead of complex class hierarchies.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
import time

# Add src directory to path for clean imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Import all our functional modules
from api_clients.news_fetcher import fetch_all_news_sources
from api_clients.content_scraper import (
    scrape_articles_content,
    filter_articles_by_content,
)

from processing.embeddings import add_embeddings_to_articles
from processing.nlp_processing import (
    categorize_articles,
    add_keywords_to_articles,
    add_summaries_to_articles,
    add_trending_scores_to_articles,
)
from processing.deduplication import deduplicate_articles

from db.supabase_operations import save_articles_to_database, check_existing_urls

from utils.logging_config import setup_logging

logger = logging.getLogger(__name__)


def run_news_pipeline():
    """
    Main pipeline function - orchestrates the entire news processing workflow.

    This is a simple procedural flow that's easy to understand and maintain.
    """

    logger.info("🚀 Starting News Aggregation Pipeline")
    logger.info("📋 Functional Architecture - Simple and Clean")
    start_time = time.time()

    # Pipeline statistics
    stats = {
        "articles_fetched": 0,
        "articles_scraped": 0,
        "articles_processed": 0,
        "articles_saved": 0,
        "errors": [],
    }

    try:
        # ====================================================================
        # STEP 1: FETCH NEWS ARTICLES
        # ====================================================================
        logger.info("\n📰 STEP 1: Fetching news articles...")

        raw_articles = fetch_all_news_sources(
            max_articles=20
        )  # Start small for testing

        if not raw_articles:
            logger.error("❌ No articles fetched, stopping pipeline")
            return stats

        stats["articles_fetched"] = len(raw_articles)
        logger.info(f"✅ Fetched {len(raw_articles)} articles from news sources")

        # Log sample articles
        for i, article in enumerate(raw_articles[:3], 1):
            title = article.get("title", "Unknown")[:60]
            logger.info(f"   📄 Sample {i}: {title}...")

        # ====================================================================
        # STEP 2: FILTER EXISTING ARTICLES
        # ====================================================================
        logger.info("\n🔍 STEP 2: Checking for existing articles...")

        article_urls = [
            article.get("url") for article in raw_articles if article.get("url")
        ]
        existing_urls = check_existing_urls(article_urls)

        # Filter out existing articles
        new_articles = [
            article
            for article in raw_articles
            if article.get("url") not in existing_urls
        ]

        logger.info(f"📊 Found {len(existing_urls)} existing articles")
        logger.info(f"✨ Processing {len(new_articles)} new articles")

        if not new_articles:
            logger.info("✅ All articles already exist in database, pipeline complete")
            return stats

        # ====================================================================
        # STEP 3: SCRAPE FULL CONTENT
        # ====================================================================
        logger.info("\n🌐 STEP 3: Scraping article content...")

        scraped_articles = scrape_articles_content(new_articles, max_workers=3)

        # Filter articles with sufficient content
        content_filtered_articles = filter_articles_by_content(
            scraped_articles, min_content_length=150
        )

        stats["articles_scraped"] = len(content_filtered_articles)
        logger.info(
            f"✅ Successfully scraped {len(content_filtered_articles)} articles with good content"
        )

        if not content_filtered_articles:
            logger.warning("⚠️ No articles with sufficient content, stopping pipeline")
            return stats

        # ====================================================================
        # STEP 4: GENERATE EMBEDDINGS
        # ====================================================================
        logger.info("\n🧠 STEP 4: Generating embeddings (GPU accelerated)...")

        articles_with_embeddings = add_embeddings_to_articles(content_filtered_articles)

        embedding_count = len(
            [a for a in articles_with_embeddings if a.get("embedding")]
        )
        logger.info(f"✅ Generated embeddings for {embedding_count} articles")

        # ====================================================================
        # STEP 5: REMOVE DUPLICATES
        # ====================================================================
        logger.info("\n🔄 STEP 5: Removing duplicates...")

        unique_articles = deduplicate_articles(
            articles_with_embeddings, similarity_threshold=0.85
        )

        logger.info(
            f"✨ Removed {len(articles_with_embeddings) - len(unique_articles)} duplicate articles"
        )
        logger.info(f"📊 Proceeding with {len(unique_articles)} unique articles")

        # ====================================================================
        # STEP 6: NLP PROCESSING
        # ====================================================================
        logger.info(
            "\n🏷️ STEP 6: NLP processing (categorization, keywords, summaries)..."
        )

        # Categorize articles
        categorized_articles = categorize_articles(unique_articles)
        logger.info("   ✅ Articles categorized")

        # Extract keywords
        articles_with_keywords = add_keywords_to_articles(categorized_articles)
        logger.info("   ✅ Keywords extracted")

        # Generate summaries
        articles_with_summaries = add_summaries_to_articles(articles_with_keywords)
        logger.info("   ✅ Summaries generated")

        # Calculate trending scores
        processed_articles = add_trending_scores_to_articles(articles_with_summaries)
        logger.info("   ✅ Trending scores calculated")

        stats["articles_processed"] = len(processed_articles)
        logger.info(
            f"🎉 Completed NLP processing for {len(processed_articles)} articles"
        )

        # Log processing results
        categories = {}
        for article in processed_articles:
            category = article.get("category", "unknown")
            categories[category] = categories.get(category, 0) + 1

        logger.info("📊 Category distribution:")
        for category, count in categories.items():
            logger.info(f"   📂 {category}: {count} articles")

        # ====================================================================
        # STEP 7: SAVE TO DATABASE
        # ====================================================================
        logger.info("\n💾 STEP 7: Saving to Supabase database...")

        saved_ids = save_articles_to_database(processed_articles)

        stats["articles_saved"] = len(saved_ids)

        if saved_ids:
            logger.info(f"✅ Successfully saved {len(saved_ids)} articles to database")

            # Log some saved article IDs
            for i, article_id in enumerate(saved_ids[:3], 1):
                logger.info(f"   📄 Article {i} ID: {article_id}")
        else:
            logger.error("❌ Failed to save articles to database")
            stats["errors"].append("Database save operation failed")

        # ====================================================================
        # PIPELINE COMPLETE
        # ====================================================================
        execution_time = time.time() - start_time

        logger.info("\n" + "=" * 80)
        logger.info("🎉 NEWS PIPELINE COMPLETED SUCCESSFULLY!")
        logger.info("=" * 80)
        logger.info(f"⏱️  Total execution time: {execution_time:.2f} seconds")
        logger.info(f"📊 Articles fetched: {stats['articles_fetched']}")
        logger.info(f"🌐 Articles scraped: {stats['articles_scraped']}")
        logger.info(f"🧠 Articles processed: {stats['articles_processed']}")
        logger.info(f"💾 Articles saved: {stats['articles_saved']}")

        if stats["errors"]:
            logger.info(f"❌ Errors encountered: {len(stats['errors'])}")
            for error in stats["errors"]:
                logger.info(f"   - {error}")

        success_rate = (
            stats["articles_saved"] / max(stats["articles_fetched"], 1)
        ) * 100
        logger.info(f"🎯 Pipeline success rate: {success_rate:.1f}%")

        if success_rate >= 50:
            logger.info("✅ Pipeline performance: EXCELLENT")
        elif success_rate >= 25:
            logger.info("⚠️ Pipeline performance: GOOD")
        else:
            logger.info("❌ Pipeline performance: NEEDS ATTENTION")

        logger.info("=" * 80)

        return stats

    except Exception as e:
        logger.error(f"❌ Pipeline failed with error: {e}")
        stats["errors"].append(f"Pipeline failure: {str(e)}")
        return stats


def main():
    """Entry point for the news pipeline."""

    # Setup logging
    setup_logging()

    logger.info("=" * 80)
    logger.info("🚀 NEWS AGGREGATION PIPELINE - FUNCTIONAL ARCHITECTURE")
    logger.info("=" * 80)
    logger.info(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Run the pipeline
        stats = run_news_pipeline()

        # Final status
        if stats["articles_saved"] > 0:
            logger.info("🎉 SUCCESS: Pipeline completed with articles saved!")
            return 0  # Success exit code
        else:
            logger.warning("⚠️ WARNING: Pipeline completed but no articles were saved")
            return 1  # Warning exit code

    except KeyboardInterrupt:
        logger.info("⏹️ Pipeline interrupted by user")
        return 130  # SIGINT exit code

    except Exception as e:
        logger.error(f"💥 FATAL ERROR: {e}")
        return 1  # Error exit code


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
