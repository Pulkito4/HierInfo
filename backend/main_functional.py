"""
News Pipeline - Production Entry Point

This is the main orchestration file for the news processing pipeline.
Designed for production deployment as a cron job or scheduled task.

Features:
- Fetches news from GNews API
- Parses article content with two-tier fallback
- Creates in-memory DataFrame for preprocessing
- Comprehensive logging and error handling
- Ready for NLP processing integration

Usage:
    python main_functional.py                    # Run with default settings
    python main_functional.py --articles 50     # Fetch 50 articles
    python main_functional.py --test            # Run in test mode
"""

import os
import sys
import argparse
from datetime import datetime
from typing import Optional

# Add src directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import production modules
from api_clients.news_fetcher import fetch_articles_from_gnews, validate_api_connection
from api_clients.content_scraper import parse_article_with_two_tier_fallback, parse_articles_batch
from processing.dataframe_processor import create_and_populate_dataframe, display_dataframe_info, prepare_for_nlp_processing
from utils.logging_config import setup_logging, get_logger

def setup_production_logging():
    """Set up logging for production environment."""
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    return setup_logging(log_level=log_level, console_output=True)

def validate_environment() -> bool:
    """
    Validate that all required environment variables and dependencies are available.
    
    Returns:
        bool: True if environment is properly configured
    """
    logger = get_logger(__name__)
    logger.info("🔧 Validating production environment...")
    
    # Check for required environment variables
    required_env_vars = ['GNEWS_API_KEY']
    missing_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {missing_vars}")
        return False
    
    # Test API connectivity
    logger.info("🌐 Testing API connectivity...")
    if not validate_api_connection():
        logger.error("❌ GNews API connection failed")
        return False
    
    logger.info("✅ Environment validation successful")
    return True

def enriched_parse_article(gnews_article_data: dict, parsed_content: dict) -> dict:
    """
    Combine GNews API data with parsed content to create DataFrame-ready structure.
    
    Args:
        gnews_article_data (dict): Original article data from GNews API
        parsed_content (dict): Parsed content from content scrapers
        
    Returns:
        dict: Enriched article data ready for DataFrame
    """
    return {
        'url': gnews_article_data.get('url', ''),
        'title': parsed_content.get('title') or gnews_article_data.get('title', ''),
        'source_name': gnews_article_data.get('source', {}).get('name', ''),
        'published_at': parsed_content.get('published_at') or gnews_article_data.get('publishedAt'),
        'image_url': parsed_content.get('image_url') or gnews_article_data.get('image', ''),
        'text': parsed_content.get('text', ''),
        'authors': parsed_content.get('authors', []),
        'parsing_method': parsed_content.get('method', 'unknown'),
        'domain': parsed_content.get('domain', '')
    }

def main_pipeline(
    max_articles: int = 100,
    test_mode: bool = False,
    enable_batch_parsing: bool = True
) -> Optional[object]:
    """
    Main production pipeline for news processing.
    
    This function orchestrates the entire news processing workflow:
    1. Fetch articles from GNews API
    2. Parse article content with fallback strategies
    3. Create and populate DataFrame for preprocessing
    4. Prepare data for NLP processing
    
    Args:
        max_articles (int): Maximum number of articles to process
        test_mode (bool): If True, runs in test mode with reduced articles
        enable_batch_parsing (bool): If True, uses concurrent parsing for better performance
        
    Returns:
        DataFrame: Processed news DataFrame ready for NLP, or None if failed
    """
    
    logger = get_logger(__name__)
    
    # Adjust parameters for test mode
    if test_mode:
        max_articles = min(max_articles, 5)
        logger.info(f"🧪 Running in test mode with {max_articles} articles")
    
    pipeline_start_time = datetime.now()
    logger.info(f"🚀 Starting News Processing Pipeline")
    logger.info(f"📊 Target: {max_articles} articles")
    logger.info(f"⏰ Started at: {pipeline_start_time.isoformat()}")
    logger.info("=" * 60)
    
    try:
        # Step 1: Fetch articles from GNews API
        logger.info("📰 Step 1: Fetching articles from GNews API...")
        gnews_articles = fetch_articles_from_gnews(
            max_articles=max_articles,
            category="world",  # Can be parameterized
            country="in",      # Can be parameterized
            language="en"      # Can be parameterized
        )
        
        if not gnews_articles:
            logger.error("❌ No articles fetched from GNews API. Pipeline terminated.")
            return None
        
        logger.info(f"✅ Fetched {len(gnews_articles)} articles from GNews API")
        
        # Step 2: Parse article content
        logger.info("🔍 Step 2: Parsing article content...")
        
        if enable_batch_parsing and len(gnews_articles) > 3:
            # Use batch parsing for better performance with many articles
            logger.info("⚡ Using batch parsing for improved performance...")
            urls = [article.get('url') for article in gnews_articles if article.get('url')]
            parsed_contents = parse_articles_batch(urls, max_workers=5)
            
            # Create a mapping of URL to parsed content
            parsed_map = {content['url']: content for content in parsed_contents if content}
            
            # Enrich articles with parsed content
            enriched_articles = []
            for gnews_article in gnews_articles:
                url = gnews_article.get('url')
                if url in parsed_map:
                    enriched_article = enriched_parse_article(gnews_article, parsed_map[url])
                    enriched_articles.append(enriched_article)
        else:
            # Use sequential parsing for smaller batches or when batch parsing is disabled
            logger.info("🔄 Using sequential parsing...")
            enriched_articles = []
            
            for i, gnews_article in enumerate(gnews_articles, 1):
                url = gnews_article.get('url', '')
                
                if not url:
                    logger.warning(f"⚠️  Article {i}: No URL found, skipping")
                    continue
                
                logger.info(f"📖 Parsing article {i}/{len(gnews_articles)}: {url}")
                
                # Parse with two-tier fallback
                parsed_content = parse_article_with_two_tier_fallback(url)
                
                if parsed_content and parsed_content.get('text'):
                    # Enrich with GNews data
                    enriched_article = enriched_parse_article(gnews_article, parsed_content)
                    enriched_articles.append(enriched_article)
                    logger.debug(f"✅ Successfully parsed article {i}")
                else:
                    logger.warning(f"❌ Failed to parse article {i}")
        
        parsed_count = len(enriched_articles)
        success_rate = (parsed_count / len(gnews_articles)) * 100 if gnews_articles else 0
        
        logger.info(f"📊 Parsing completed: {parsed_count}/{len(gnews_articles)} articles ({success_rate:.1f}% success)")
        
        if not enriched_articles:
            logger.error("❌ No articles successfully parsed. Pipeline terminated.")
            return None
        
        # Step 3: Create and populate DataFrame
        logger.info("📊 Step 3: Creating DataFrame for preprocessing...")
        
        df = create_and_populate_dataframe(enriched_articles)
        
        if df is None or len(df) == 0:
            logger.error("❌ Failed to create DataFrame. Pipeline terminated.")
            return None
        
        logger.info(f"✅ DataFrame created with {len(df)} articles")
        
        # Step 4: Prepare for NLP processing
        logger.info("🤖 Step 4: Preparing DataFrame for NLP processing...")
        
        nlp_ready_df = prepare_for_nlp_processing(df)
        
        logger.info(f"🧹 NLP preparation completed: {len(nlp_ready_df)} articles ready for processing")
        
        # Step 5: Display comprehensive results
        logger.info("📈 Step 5: Pipeline Results Summary...")
        display_dataframe_info(nlp_ready_df, show_sample=True)
        
        # Calculate pipeline performance metrics
        pipeline_end_time = datetime.now()
        pipeline_duration = pipeline_end_time - pipeline_start_time
        
        logger.info("🏁 Pipeline completed successfully!")
        logger.info(f"⏱️  Total Duration: {pipeline_duration.total_seconds():.2f} seconds")
        logger.info(f"📊 Final Articles: {len(nlp_ready_df)}")
        logger.info(f"🎯 Ready for: Summarization, Categorization, Embedding Generation")
        
        return nlp_ready_df
        
    except Exception as e:
        logger.error(f"💀 Pipeline failed with error: {str(e)}")
        logger.exception("Full error traceback:")
        return None

def test_pipeline():
    """
    Run the pipeline in test mode for verification.
    
    This function is useful for:
    - Development testing
    - Deployment verification  
    - CI/CD pipeline checks
    """
    
    logger = get_logger(__name__)
    logger.info("🧪 Running pipeline test...")
    
    try:
        # Run pipeline with test settings
        result = main_pipeline(max_articles=3, test_mode=True, enable_batch_parsing=False)
        
        if result is not None and len(result) > 0:
            logger.info("✅ Pipeline test successful!")
            return True
        else:
            logger.error("❌ Pipeline test failed - no results returned")
            return False
            
    except Exception as e:
        logger.error(f"💀 Pipeline test failed with error: {str(e)}")
        return False

def main():
    """
    Main entry point for command-line execution.
    
    Supports various execution modes:
    - Production mode (default)
    - Test mode for verification
    - Configurable article counts
    """
    
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='News Processing Pipeline')
    parser.add_argument('--articles', type=int, default=100, 
                       help='Maximum number of articles to process (default: 100)')
    parser.add_argument('--test', action='store_true',
                       help='Run in test mode with reduced articles')
    parser.add_argument('--no-batch', action='store_true',
                       help='Disable batch parsing (use sequential parsing)')
    
    args = parser.parse_args()
    
    # Set up logging
    logger = setup_production_logging()
    
    # Print startup banner
    print("🚀 News Processing Pipeline - Production Version")
    print("=" * 50)
    
    # Validate environment
    if not validate_environment():
        logger.error("❌ Environment validation failed. Exiting.")
        sys.exit(1)
    
    # Determine execution mode
    if args.test:
        logger.info("🧪 Test mode requested")
        success = test_pipeline()
        sys.exit(0 if success else 1)
    else:
        logger.info("🏭 Production mode")
        result = main_pipeline(
            max_articles=args.articles,
            test_mode=False,
            enable_batch_parsing=not args.no_batch
        )
        
        if result is not None:
            logger.info("🎉 Pipeline execution completed successfully!")
            
            # TODO: Add integration points for:
            # - Save to Supabase database
            # - Trigger NLP processing
            # - Send notifications/alerts
            
            sys.exit(0)
        else:
            logger.error("💀 Pipeline execution failed!")
            sys.exit(1)

if __name__ == "__main__":
    main()