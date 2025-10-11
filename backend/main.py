# main.py

import os
import pandas as pd
from dotenv import load_dotenv
import logging

# Import the new, correct client function
from src.api_clients.gnews_client import fetch_and_process_gnews_articles
from src.api_clients.rss_client import fetch_rss_articles

# Configure basic logging for the entire pipeline
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

def run_pipeline():
    """Orchestrates the entire news data processing pipeline."""
    logger.info("=============================================")
    logger.info("🚀 STARTING NEWS AGGREGATOR PIPELINE")
    logger.info("=============================================")
    
    # Load environment variables from .env file for the clients to use
    load_dotenv()

    # --- 1. DATA FETCHING ---
    logger.info("STEP 1: Fetching data from all sources...")
    
    # Fetch from GNews using your robust, refactored client
    gnews_data = fetch_and_process_gnews_articles(
        max_articles=25,
        category="technology",
        country="in"
    )
    
    # Fetch from RSS (placeholder)
    rss_data = fetch_rss_articles()
    
    all_articles_data = gnews_data + rss_data
    
    if not all_articles_data:
        logger.warning("⚠️ No articles were fetched from any source. Exiting pipeline.")
        return
        
    logger.info(f"✅ STEP 1 COMPLETE: Fetched a total of {len(all_articles_data)} articles.")

    # --- 2. DATAFRAME CREATION ---
    logger.info("STEP 2: Creating main DataFrame...")
    
    main_df = pd.DataFrame(all_articles_data)
    
    if not main_df.empty:
        main_df = main_df.set_index('url')
    
    logger.info(f"✅ STEP 2 COMPLETE: DataFrame created with shape {main_df.shape}.")
    
    print("\n--- Main DataFrame Head ---")
    print(main_df.head())
    print("\n-------------------------\n")

    # --- 3. DATA PREPROCESSING & STORAGE (Future Steps) ---
    # (Placeholders remain the same)
    
    logger.info("=============================================")
    logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
    logger.info("=============================================")


if __name__ == "__main__":
    run_pipeline()