from dotenv import load_dotenv
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

# Load environment variables FIRST
load_dotenv()
# Initialize the logger for the entire application
logger = setup_logging()


def run_pipeline_logic():
    """
    Contains the core logic of the data pipeline.
    This function is wrapped by the main entry point to handle logging and error reporting.
    """
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
        return None

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

        # --- Semantic Consistency Guardrail ("Bouncer") ---
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
        except Exception as exc:  # pragma: no cover - defensive logging
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
        return None
    logger.info(f"✅ Ingestion complete. {len(main_df)} articles ready for processing.")

    # --- 2. NLP PROCESSING ---
    logger.info("--- PHASE 2: NLP PROCESSING ---")
    main_df = generate_embeddings(main_df)
    unique_articles_df = cluster_and_deduplicate(main_df)
    unique_articles_df = generate_summaries(unique_articles_df)
    
    # Early exit if no articles have valid summaries
    if unique_articles_df.empty:
        logger.warning("No articles remain after summarization. Exiting pipeline.")
        return None
    
    unique_articles_df = set_critical_flag(unique_articles_df)
    unique_articles_df = generate_categories(unique_articles_df)
    unique_articles_df = generate_topic_tags(unique_articles_df)
    logger.info("✅ NLP Processing complete.")
    logger.info(
        "--- Final DataFrame Head ---\n%s", unique_articles_df.head().to_string()
    )

    # --- 3. DATABASE STORAGE ---
    logger.info("--- PHASE 3: DATABASE STORAGE ---")
    db_manager = SupabaseManager()
    category_map = db_manager.fetch_category_map()
    if category_map:
        db_manager.store_data(unique_articles_df, category_map)
    else:
        logger.error("Could not fetch category map. Data will not be stored.")

    return unique_articles_df


if __name__ == "__main__":
    db_manager = None
    status = "SUCCESS"
    error_msg = None
    records_processed = 0

    try:
        # Initialize the manager at the start to ensure it's available for logging
        db_manager = SupabaseManager()

        # --- Run the main pipeline logic ---
        final_df = run_pipeline_logic()

        if final_df is not None:
            records_processed = len(final_df)

            # --- TRIGGER CACHE REFRESH ON SUCCESS ---
            logger.info("--- PHASE 4: REFRESHING CACHES ---")
            db_manager.refresh_materialized_feeds()

            logger.info("===================================================")
            logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
            logger.info("===================================================")
        else:
            status = "SUCCESS_EMPTY"  # A different status for successful but empty runs
            logger.info("Pipeline ran successfully but produced no articles to store.")

    except Exception as e:
        logger.critical(f"🔥 PIPELINE FAILED with a critical error: {e}", exc_info=True)
        status = "FAILURE"
        error_msg = str(e)

    finally:
        # This block ALWAYS runs, ensuring we log the final status to the database
        if db_manager:
            db_manager.log_pipeline_run(
                status=status, records_added=records_processed, error_message=error_msg
            )
        else:
            logger.error(
                "Database manager could not be initialized. Pipeline status was not logged to Supabase."
            )

        logger.info("Pipeline execution finished.")
