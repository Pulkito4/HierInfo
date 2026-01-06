"""
Modal deployment for the News Aggregator Pipeline
Runs the entire news processing pipeline on GPU with scheduled cron jobs
"""

import modal

# ======================================================================
# MODAL SETUP
# ======================================================================

# Create the Modal app
app = modal.App("news-aggregator-pipeline")

# Define the Docker image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    # Install all Python dependencies from requirements.txt
    .pip_install_from_requirements("requirements.txt")
    # Explicitly install packages that sometimes aren't pulled correctly as dependencies
    .pip_install("supabase-auth==2.22.2", "gotrue==2.11.4", "lxml-html-clean==0.4.2")
    .run_commands(
        # Install Playwright browsers (needed for content scraping)
        "playwright install chromium",
        "playwright install-deps chromium",
    )
    # Add the entire backend directory to the container
    .add_local_dir(
        ".", 
        "/root", 
        ignore=["__pycache__", "*.pyc", ".git", "logs", ".env", "model_cache", ".venv"]
    )
)

# ======================================================================
# SCHEDULED PIPELINE FUNCTION
# ======================================================================

@app.function(
    image=image,
    gpu="T4",  # Nvidia T4 GPU - cheapest option, perfect for your workload
    secrets=[modal.Secret.from_name("news-aggregator-secrets")],
    timeout=3600,  # 1 hour max (should finish much faster with GPU)
    schedule=modal.Cron("30 19 * * *"),  # Runs daily at 1 AM IST
    # Use modal Volumes for model caching to avoid re-downloading models
    volumes={"/model_cache": modal.Volume.from_name("model-cache", create_if_missing=True)},
)
def run_news_pipeline():
    """
    Main pipeline function that runs on Modal's GPU infrastructure.
    This is scheduled to run automatically via the cron schedule above.
    """
    import os
    import sys
    
    # Set environment variables for model caching
    os.environ["HF_HOME"] = "/model_cache/huggingface"
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = "/model_cache/sentence_transformers"
    
    # Add the current directory to Python path so imports work
    sys.path.insert(0, "/root")
    
    # Import after path is set
    from src.api_clients import fetch_gnews_metadata, fetch_rss_metadata
    from src.database import SupabaseManager
    from src.processing import (
        generate_embeddings,
        cluster_and_deduplicate,
        generate_summaries,
        set_critical_flag,
        generate_categories,
        generate_topic_tags,
    )
    from src.scrapers import parse_articles_batch
    from utils import check_title_content_alignment
    from utils.dataframe_utils import create_main_dataframe
    from utils.logging_config import setup_logging
    
    # Initialize logger
    logger = setup_logging()
    
    logger.info("===================================================")
    logger.info("🚀 STARTING MODAL NEWS PIPELINE (GPU)")
    logger.info("===================================================")
    
    db_manager = None
    status = "SUCCESS"
    error_msg = None
    records_processed = 0
    
    try:
        # Initialize database manager
        db_manager = SupabaseManager()
        
        # --- 1. DATA INGESTION ---
        logger.info("--- PHASE 1: DATA INGESTION ---")
        all_metadata = []
        all_metadata.extend(fetch_gnews_metadata())
        all_metadata.extend(fetch_rss_metadata())
        
        if not all_metadata:
            logger.warning("No article metadata fetched. Exiting.")
            status = "SUCCESS_EMPTY"
            return
        
        urls_to_scrape = [meta["url"] for meta in all_metadata]
        scraped_content_list = parse_articles_batch(urls_to_scrape)
        scraped_content_map = {
            c.get("url"): c for c in scraped_content_list if c and c.get("url")
        }
        
        final_articles_data = []
        for meta in all_metadata:
            url = meta.get("url")
            if not url:
                continue
            
            scraped = scraped_content_map.get(url)
            if not scraped:
                logger.warning(
                    "Skipping article, content could not be scraped for: %s", url
                )
                continue
            
            final_data = meta.copy()
            final_data["raw_content"] = scraped.get("raw_content")
            
            # Semantic Consistency Check
            try:
                metadata_title = meta.get("title")
                scraped_content = scraped.get("raw_content")
                
                is_consistent, similarity, reason = check_title_content_alignment(
                    metadata_title, scraped_content
                )
                
                if reason == "content_too_short":
                    logger.debug(
                        "Skipping similarity check for %s because raw_content is short.",
                        url,
                    )
                
                if not is_consistent:
                    if reason == "missing_content":
                        logger.warning(
                            "Skipping article %s due to unusable raw_content.", url
                        )
                    else:
                        snippet = (scraped_content or "")[:60].replace("\n", " ")
                        sim_display = (
                            f"{similarity:.2f}" if similarity is not None else "N/A"
                        )
                        logger.warning(
                            (
                                "CONTENT MISMATCH DETECTED for %s. Title: '%s', "
                                "Content snippet: '%s...'. Similarity: %s. Skipping."
                            ),
                            url,
                            metadata_title,
                            snippet,
                            sim_display,
                        )
                    continue
            except Exception as exc:
                logger.error("Error during consistency check for %s: %s", url, exc)
            
            final_data["image_url"] = final_data.get("image_url") or scraped.get(
                "image_url"
            )
            final_data["parsing_method"] = scraped.get("parsing_method")
            final_data["title"] = scraped.get("title") or final_data.get("title")
            
            final_articles_data.append(final_data)
        
        main_df = create_main_dataframe(final_articles_data)
        if main_df.empty:
            logger.warning("DataFrame is empty after ingestion. Exiting.")
            status = "SUCCESS_EMPTY"
            return
        
        logger.info(f"✅ Ingestion complete. {len(main_df)} articles ready for processing.")
        
        # --- 2. NLP PROCESSING (GPU ACCELERATED) ---
        logger.info("--- PHASE 2: NLP PROCESSING (GPU) ---")
        main_df = generate_embeddings(main_df)
        unique_articles_df = cluster_and_deduplicate(main_df)
        
        # GPU optimization: Use sequential processing (no parallel workers)
        # GPU is already massively parallel internally - multiple workers cause contention
        logger.info("Using sequential processing optimized for single GPU")
        
        # Clear GPU cache before heavy summarization work
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info("🧹 Cleared GPU cache before summarization")
        
        unique_articles_df = generate_summaries(unique_articles_df)
        
        if unique_articles_df.empty:
            logger.warning("No articles remain after summarization. Exiting pipeline.")
            status = "SUCCESS_EMPTY"
            return
        
        # Check for GPU errors after summarization and reset if needed
        import torch
        if torch.cuda.is_available():
            try:
                # Test if GPU is still functional
                torch.cuda.synchronize()
                torch.cuda.empty_cache()
                logger.info("✅ GPU context verified and cleared after summarization")
            except RuntimeError as e:
                logger.error(f"⚠️ GPU context corrupted after summarization: {e}")
                logger.info("🔄 Resetting GPU context...")
                # Force GPU reset by clearing all references and cache
                import gc
                gc.collect()
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
                logger.info("✅ GPU context reset complete")
        
        unique_articles_df = set_critical_flag(unique_articles_df)
        unique_articles_df = generate_categories(unique_articles_df)
        unique_articles_df = generate_topic_tags(unique_articles_df)
        logger.info("✅ NLP Processing complete.")
        logger.info(
            "--- Final DataFrame Head ---\n%s", unique_articles_df.head().to_string()
        )
        
        # --- 3. DATABASE STORAGE ---
        logger.info("--- PHASE 3: DATABASE STORAGE ---")
        category_map = db_manager.fetch_category_map()
        if category_map:
            db_manager.store_data(unique_articles_df, category_map)
            records_processed = len(unique_articles_df)
        else:
            logger.error("Could not fetch category map. Data will not be stored.")
            raise Exception("Failed to fetch category map from database")
        
        # --- 4. REFRESH CACHES ---
        logger.info("--- PHASE 4: REFRESHING CACHES ---")
        db_manager.refresh_materialized_feeds()
        
        logger.info("===================================================")
        logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY ON MODAL GPU")
        logger.info(f"📊 Processed {records_processed} articles")
        logger.info("===================================================")
        
    except Exception as e:
        logger.critical(f"🔥 PIPELINE FAILED: {e}", exc_info=True)
        status = "FAILURE"
        error_msg = str(e)
        raise  # Re-raise to mark Modal run as failed
    
    finally:
        # Log pipeline run to database
        if db_manager:
            db_manager.log_pipeline_run(
                status=status,
                records_added=records_processed,
                error_message=error_msg,
            )
        else:
            logger.error("Database manager not initialized. Status not logged.")


# ======================================================================
# MANUAL TRIGGER (for testing)
# ======================================================================


@app.local_entrypoint()
def main():
    """
    Local entrypoint for testing/manual runs.
    Run with: modal run modal_app.py
    """
    print("🚀 Triggering news pipeline manually...")
    run_news_pipeline.remote()
    print("✅ Pipeline completed!")
