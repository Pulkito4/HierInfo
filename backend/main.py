from dotenv import load_dotenv
from utils import setup_logging

# --- Phase 1: Ingestion ---
from src.api_clients import fetch_gnews_metadata, fetch_rss_metadata
from src.scrapers import parse_articles_batch
from utils import create_main_dataframe

# --- Phase 2: Processing ---
from src.processing import (
    generate_embeddings,
    cluster_and_deduplicate,
    generate_summaries,
    set_critical_flag,
    generate_keywords,
    generate_categories
)

# --- Phase 3: Storage ---
from src.database import SupabaseManager

# ======================================================================
#   SETUP: Initialize logger and load environment variables
# ======================================================================
load_dotenv()
logger = setup_logging()

def run_pipeline():
    """Orchestrates the entire news data ingestion and processing pipeline."""
    logger.info("===================================================")
    logger.info("🚀 STARTING FULL NEWS PIPELINE")
    logger.info("===================================================")

    # --- 1. DATA INGESTION ---
    logger.info("--- PHASE 1: DATA INGESTION ---")
    all_metadata = []
    all_metadata.extend(fetch_gnews_metadata())
    all_metadata.extend(fetch_rss_metadata())
    if not all_metadata:
        logger.warning("No article metadata fetched. Exiting.")
        return

    urls_to_scrape = [meta['url'] for meta in all_metadata]
    scraped_content_list = parse_articles_batch(urls_to_scrape)
    scraped_content_map = {c.get('url'): c for c in scraped_content_list if c and c.get('url')}

    final_articles_data = []
    for meta in all_metadata:
        url = meta.get('url')
        if not url:
            continue
        scraped = scraped_content_map.get(url)
        if scraped:
            final_data = meta.copy()
            # Map scraper fields to our dataframe schema
            final_data['raw_content'] = scraped.get('text')
            final_data['image_url'] = final_data.get('image_url') or scraped.get('image_url')
            final_data['parsing_method'] = scraped.get('method')
            # Prefer metadata title but fallback to scraped title
            if not final_data.get('title'):
                final_data['title'] = scraped.get('title')
            final_articles_data.append(final_data)

    main_df = create_main_dataframe(final_articles_data)
    if main_df.empty:
        logger.warning("DataFrame is empty after ingestion. Exiting.")
        return
    logger.info(f"✅ Ingestion complete. {len(main_df)} articles ready for processing.")

    # --- 2. NLP PROCESSING ---
    logger.info("--- PHASE 2: NLP PROCESSING ---")
    # Step 2.1: Generate embeddings for all articles
    main_df = generate_embeddings(main_df)
    
    # Step 2.2: Cluster, calculate trending_score, and get unique articles
    unique_articles_df = cluster_and_deduplicate(main_df)

    # Step 2.3: Run final enrichment on the smaller, unique DataFrame
    unique_articles_df = generate_summaries(unique_articles_df)
    unique_articles_df = set_critical_flag(unique_articles_df)
    unique_articles_df = generate_keywords(unique_articles_df)
    unique_articles_df = generate_categories(unique_articles_df)
    logger.info("✅ NLP Processing complete.")
    logger.info("--- Final DataFrame Head ---\n%s", unique_articles_df.head().to_string())

    # --- 3. DATABASE STORAGE ---
    logger.info("--- PHASE 3: DATABASE STORAGE ---")
    try:
        db_manager = SupabaseManager()
        category_map = db_manager.fetch_category_map()
        if category_map:
            db_manager.store_data(unique_articles_df, category_map)
        else:
            logger.error("Could not fetch category map. Data will not be stored.")
    except Exception as e:
        logger.critical(f"A critical error occurred during database initialization or storage: {e}")

    logger.info("===================================================")
    logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
    logger.info("===================================================")

if __name__ == "__main__":
    run_pipeline()