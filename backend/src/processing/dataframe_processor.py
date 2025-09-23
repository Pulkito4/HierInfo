"""
DataFrame Processor - Production Version

Production-ready module for creating and processing news DataFrames.
Handles in-memory DataFrame operations for preprocessing before NLP tasks.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from utils.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)

def create_news_dataframe() -> pd.DataFrame:
    """
    Create an empty DataFrame with the required structure for news preprocessing.
    
    This DataFrame structure matches the database schema and is optimized for
    in-memory processing of news articles before NLP operations.
    
    Returns:
        pd.DataFrame: Empty DataFrame with proper schema and data types
    """
    
    logger.debug("📊 Creating empty news DataFrame with production schema...")
    
    # Define all columns as per your specification
    columns = [
        "url",              # string - Primary Key, unique URL to the article
        "title",            # string - Standardized article title  
        "source_name",      # string - Standardized source name (e.g., "BBC News")
        "published_at",     # datetime64[ns, UTC] - Standardized publication timestamp
        "image_url",        # string - URL for the article's main image
        "raw_content",      # string - Full article text scraped by content parsers
        "summary",          # string - AI-generated summary from DistilBART (to be added)
        "embedding",        # object (numpy array) - Vector embedding from all-MiniLM-L6-v2 (to be added)
        "categories",       # object (list) - List of category strings from Zero-Shot model (to be added)
        "keywords",         # object (list) - List of keyword strings from KeyBERT (to be added)
        "trending_score",   # int - Calculated score based on clustering/source count (to be calculated)
        "is_critical"       # bool - Flag indicating if news is critical (to be determined)
    ]
    
    # Create DataFrame with specified columns
    df = pd.DataFrame(columns=columns)
    
    # Set proper data types for performance and memory efficiency
    df = df.astype({
        'url': 'string',
        'title': 'string', 
        'source_name': 'string',
        'image_url': 'string',
        'raw_content': 'string',
        'summary': 'string',
        'trending_score': 'int64',
        'is_critical': 'bool'
    })
    
    logger.info("✅ Created empty news DataFrame with proper schema and data types")
    logger.debug(f"📋 DataFrame columns: {list(df.columns)}")
    
    return df

def add_article_to_dataframe(df: pd.DataFrame, article_data: Dict) -> pd.DataFrame:
    """
    Add a single parsed article to the DataFrame efficiently.
    
    This function takes parsed article data and adds it to the DataFrame
    while maintaining data integrity and proper formatting.
    
    Args:
        df (pd.DataFrame): Existing news DataFrame
        article_data (Dict): Dictionary containing article details from parsers
        
    Returns:
        pd.DataFrame: Updated DataFrame with new article
    """
    
    try:
        # Extract article URL for logging
        url = article_data.get("url", "unknown")
        domain = url.split('/')[2] if '/' in url else url
        
        logger.debug(f"➕ Adding article to DataFrame: {domain}")
        
        # Prepare the article row with proper data types
        new_row = {
            "url": article_data.get("url", ""),
            "title": article_data.get("title", ""),
            "source_name": article_data.get("source_name", ""),
            "published_at": article_data.get("published_at", datetime.utcnow()),
            "image_url": article_data.get("image_url", ""),
            "raw_content": article_data.get("text", ""),
            # These will be populated later by NLP processing
            "summary": "",
            "embedding": np.array([]),
            "categories": [],
            "keywords": [],
            "trending_score": 0,
            "is_critical": False
        }
        
        # Add the row to DataFrame using pd.concat (more efficient than loc)
        new_df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        
        logger.debug(f"✅ Successfully added article from {domain}")
        return new_df
        
    except Exception as e:
        logger.error(f"❌ Error adding article to DataFrame: {str(e)}")
        logger.debug(f"📄 Article data keys: {list(article_data.keys()) if article_data else 'None'}")
        return df

def create_and_populate_dataframe(articles: List[Dict]) -> pd.DataFrame:
    """
    Create and populate a DataFrame from a list of parsed articles.
    
    This is the main function for converting parsed articles into a structured
    DataFrame ready for preprocessing. It includes deduplication and validation.
    
    Args:
        articles (List[Dict]): List of dictionaries containing parsed article data
        
    Returns:
        pd.DataFrame: Populated DataFrame ready for NLP preprocessing
    """
    
    logger.info(f"🚀 Creating DataFrame from {len(articles)} parsed articles...")
    
    # Create empty DataFrame
    df = create_news_dataframe()
    
    # Track processing statistics
    added_count = 0
    skipped_count = 0
    
    # Add each article to the DataFrame
    for i, article in enumerate(articles):
        if article and article.get("url"):  # Only add valid articles with URLs
            df = add_article_to_dataframe(df, article)
            added_count += 1
        else:
            skipped_count += 1
            logger.warning(f"⚠️  Skipping invalid article at index {i} - missing URL or empty data")
    
    # Remove duplicates based on URL (primary key)
    initial_count = len(df)
    df = df.drop_duplicates(subset="url", keep="first")
    final_count = len(df)
    
    duplicate_count = initial_count - final_count
    if duplicate_count > 0:
        logger.info(f"🔄 Removed {duplicate_count} duplicate articles based on URL")
    
    # Log final statistics
    logger.info(f"📊 DataFrame creation completed:")
    logger.info(f"   ✅ Articles added: {added_count}")
    logger.info(f"   ⚠️  Articles skipped: {skipped_count}")
    logger.info(f"   🔄 Duplicates removed: {duplicate_count}")
    logger.info(f"   📋 Final unique articles: {final_count}")
    
    return df

def get_dataframe_summary(df: pd.DataFrame) -> Dict:
    """
    Get comprehensive summary statistics of the DataFrame.
    
    This function provides detailed analytics about the DataFrame content
    for monitoring and debugging purposes.
    
    Args:
        df (pd.DataFrame): News DataFrame to analyze
        
    Returns:
        Dict: Comprehensive summary statistics
    """
    
    if len(df) == 0:
        return {
            "total_articles": 0,
            "unique_sources": 0,
            "articles_with_content": 0,
            "articles_with_images": 0,
            "memory_usage_mb": 0,
            "content_stats": {"min_length": 0, "max_length": 0, "avg_length": 0}
        }
    
    # Calculate content statistics
    content_lengths = df['raw_content'].str.len()
    
    summary = {
        "total_articles": len(df),
        "unique_sources": df['source_name'].nunique(),
        "articles_with_content": df['raw_content'].notna().sum(),
        "articles_with_images": df['image_url'].notna().sum(),
        "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
        "content_stats": {
            "min_length": int(content_lengths.min()) if not content_lengths.empty else 0,
            "max_length": int(content_lengths.max()) if not content_lengths.empty else 0,
            "avg_length": int(content_lengths.mean()) if not content_lengths.empty else 0
        },
        "source_distribution": df['source_name'].value_counts().head(5).to_dict() if len(df) > 0 else {},
        "has_embeddings": (df['embedding'].apply(lambda x: len(x) > 0).sum() if len(df) > 0 else 0),
        "has_summaries": (df['summary'].str.len() > 0).sum() if len(df) > 0 else 0,
        "has_categories": (df['categories'].apply(lambda x: len(x) > 0).sum() if len(df) > 0 else 0)
    }
    
    return summary

def display_dataframe_info(df: pd.DataFrame, show_sample: bool = True):
    """
    Display comprehensive information about the news DataFrame.
    
    This function provides a detailed overview of the DataFrame suitable
    for development, testing, and production monitoring.
    
    Args:
        df (pd.DataFrame): News DataFrame to analyze
        show_sample (bool): Whether to show sample data
    """
    
    print("\n" + "="*70)
    print("📊 NEWS DATAFRAME SUMMARY")
    print("="*70)
    
    summary = get_dataframe_summary(df)
    
    # Basic statistics
    print(f"📝 Total Articles: {summary['total_articles']}")
    print(f"📰 Unique Sources: {summary['unique_sources']}")
    print(f"📄 Articles with Content: {summary['articles_with_content']}")
    print(f"🖼️  Articles with Images: {summary['articles_with_images']}")
    print(f"💾 Memory Usage: {summary['memory_usage_mb']:.2f} MB")
    
    # Content statistics
    content_stats = summary['content_stats']
    print(f"📏 Content Length Stats:")
    print(f"   📐 Min: {content_stats['min_length']} chars")
    print(f"   📐 Max: {content_stats['max_length']} chars")
    print(f"   📐 Avg: {content_stats['avg_length']} chars")
    
    # NLP processing status
    print(f"🤖 NLP Processing Status:")
    print(f"   🔢 Has Embeddings: {summary['has_embeddings']}/{summary['total_articles']}")
    print(f"   📝 Has Summaries: {summary['has_summaries']}/{summary['total_articles']}")
    print(f"   🏷️  Has Categories: {summary['has_categories']}/{summary['total_articles']}")
    
    # Source distribution
    if summary['source_distribution']:
        print(f"📊 Top Sources:")
        for source, count in list(summary['source_distribution'].items())[:3]:
            print(f"   📰 {source}: {count} articles")
    
    if len(df) > 0:
        print(f"\n📋 DataFrame Schema:")
        for col, dtype in df.dtypes.items():
            print(f"   {col}: {dtype}")
        
        if show_sample:
            print(f"\n🔍 Sample Data (first 2 rows):")
            sample_cols = ['url', 'title', 'source_name', 'published_at']
            print(df[sample_cols].head(2).to_string(max_colwidth=50))
    
    print("="*70)

# def prepare_for_nlp_processing(df: pd.DataFrame) -> pd.DataFrame:
#     """
#     Prepare the DataFrame for NLP processing by cleaning and validating data.
    
#     This function filters and cleans the DataFrame to ensure high-quality
#     data for NLP tasks like summarization, categorization, and embedding generation.
    
#     Args:
#         df (pd.DataFrame): Raw news DataFrame
        
#     Returns:
#         pd.DataFrame: Cleaned DataFrame ready for NLP processing
#     """
    
#     logger.info("🧹 Preparing DataFrame for NLP processing...")
    
#     # Create a copy to avoid modifying original
#     processed_df = df.copy()
#     initial_count = len(processed_df)
    
#     # Remove articles without content
#     processed_df = processed_df[processed_df['raw_content'].notna()]
#     processed_df = processed_df[processed_df['raw_content'].str.strip() != '']
    
#     content_filtered = initial_count - len(processed_df)
#     if content_filtered > 0:
#         logger.info(f"🗑️  Removed {content_filtered} articles without valid content")
    
#     # Remove articles with very short content (less than 100 characters)
#     processed_df = processed_df[processed_df['raw_content'].str.len() >= 100]
#     short_content_filtered = initial_count - content_filtered - len(processed_df)
    
#     if short_content_filtered > 0:
#         logger.info(f"🗑️  Removed {short_content_filtered} articles with content < 100 characters")
    
#     # Remove articles with extremely long content (potential parsing errors)
#     max_content_length = 50000  # 50k characters max
#     processed_df = processed_df[processed_df['raw_content'].str.len() <= max_content_length]
#     long_content_filtered = initial_count - content_filtered - short_content_filtered - len(processed_df)
    
#     if long_content_filtered > 0:
#         logger.info(f"🗑️  Removed {long_content_filtered} articles with content > {max_content_length} characters")
    
#     # Reset index after filtering
#     processed_df = processed_df.reset_index(drop=True)
    
#     final_count = len(processed_df)
#     removed_count = initial_count - final_count
    
#     logger.info(f"✅ DataFrame ready for NLP processing:")
#     logger.info(f"   📊 Original articles: {initial_count}")
#     logger.info(f"   🗑️  Filtered out: {removed_count}")
#     logger.info(f"   ✅ Ready for NLP: {final_count}")
    
#     return processed_df

# def export_dataframe_summary(df: pd.DataFrame, filepath: str = None) -> str:
#     """
#     Export DataFrame summary to a file for reporting and monitoring.
    
#     Args:
#         df (pd.DataFrame): DataFrame to summarize
#         filepath (str, optional): Output file path. If None, creates timestamped file
        
#     Returns:
#         str: Path to the exported summary file
#     """
    
#     if filepath is None:
#         timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
#         filepath = f"dataframe_summary_{timestamp}.txt"
    
#     summary = get_dataframe_summary(df)
    
#     with open(filepath, 'w', encoding='utf-8') as f:
#         f.write("News DataFrame Summary Report\n")
#         f.write("=" * 40 + "\n")
#         f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        
#         f.write(f"Total Articles: {summary['total_articles']}\n")
#         f.write(f"Unique Sources: {summary['unique_sources']}\n")
#         f.write(f"Articles with Content: {summary['articles_with_content']}\n")
#         f.write(f"Memory Usage: {summary['memory_usage_mb']:.2f} MB\n\n")
        
#         f.write("Source Distribution:\n")
#         for source, count in summary['source_distribution'].items():
#             f.write(f"  {source}: {count}\n")
    
#     logger.info(f"📄 DataFrame summary exported to: {filepath}")
#     return filepath

def test_dataframe_functionality():
    """
    Test function for development and deployment verification.
    
    This function tests DataFrame creation and manipulation functionality
    and is useful for verifying deployment health.
    """
    
    logger.info("🧪 Starting DataFrame functionality test...")
    
    # Create sample article data
    sample_articles = [
        {
            "url": "https://example.com/news1",
            "title": "Sample News Title 1",
            "source_name": "Test News",
            "published_at": datetime.utcnow(),
            "image_url": "https://example.com/image1.jpg",
            "text": "This is the raw content of the first test article. " * 10  # Make it long enough
        },
        {
            "url": "https://example.com/news2", 
            "title": "Sample News Title 2",
            "source_name": "Test News",
            "published_at": datetime.utcnow(),
            "image_url": "https://example.com/image2.jpg",
            "text": "This is the raw content of the second test article. " * 10  # Make it long enough
        }
    ]
    
    try:
        # Test DataFrame creation and population
        df = create_and_populate_dataframe(sample_articles)
        
        if len(df) == 2:
            logger.info("✅ DataFrame creation test passed")
        else:
            logger.error(f"❌ DataFrame creation test failed: expected 2 articles, got {len(df)}")
            return False
        
        # Test summary generation
        summary = get_dataframe_summary(df)
        
        if summary['total_articles'] == 2:
            logger.info("✅ DataFrame summary test passed")
        else:
            logger.error(f"❌ DataFrame summary test failed")
            return False
        
        # Test NLP preparation
        nlp_ready_df = prepare_for_nlp_processing(df)
        
        if len(nlp_ready_df) == 2:
            logger.info("✅ NLP preparation test passed")
        else:
            logger.error(f"❌ NLP preparation test failed")
            return False
        
        logger.info("🎉 All DataFrame functionality tests passed!")
        return True
        
    except Exception as e:
        logger.error(f"💀 DataFrame functionality test failed: {str(e)}")
        return False

if __name__ == "__main__":
    """
    Direct execution for testing and development.
    """
    print("🧪 Running DataFrame Processor Tests...")
    
    # Run functionality tests
    success = test_dataframe_functionality()
    
    if success:
        print("✅ All tests passed! DataFrame processor is ready for production.")
    else:
        print("❌ Tests failed. Check logs for details.")