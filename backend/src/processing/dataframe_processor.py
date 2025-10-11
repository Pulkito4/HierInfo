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

# Creates an empty DataFrame with a fixed schema
def create_news_dataframe() -> pd.DataFrame:
    """Create an empty DataFrame with the required structure."""
    columns = [
        "url", "title", "source_name", "published_at", "image_url", 
        "raw_content", "summary", "embedding", "categories", "keywords",
        "trending_score", "is_critical", "source_type"
    ]
    
    df = pd.DataFrame(columns=columns)
    
    df = df.astype({
        'url': 'string',
        'title': 'string', 
        'source_name': 'string',
        'image_url': 'string',
        'raw_content': 'string',
        'summary': 'string',
        'source_type': 'string',
        'parsing_method': 'string',
        'trending_score': 'int64',
        'is_critical': 'bool'
    })
    
    return df

def merge_dataframes(temporary_dataframes: List[pd.DataFrame]) -> pd.DataFrame:
    """
    Merge multiple temporary DataFrames into main DataFrame.
    
    Args:
        temporary_dataframes (List[pd.DataFrame]): List of DataFrames from different sources
        
    Returns:
        pd.DataFrame: Merged main DataFrame with deduplication
    """
    logger = get_logger(__name__)
    logger.info(f"🔄 Merging {len(temporary_dataframes)} temporary DataFrames...")
    
    if not temporary_dataframes:
        logger.warning("⚠️  No DataFrames to merge")
        return create_news_dataframe()
    
    # Combine all DataFrames
    combined_df = pd.concat(temporary_dataframes, ignore_index=True)
    initial_count = len(combined_df)
    
    # Remove duplicates based on URL
    combined_df = combined_df.drop_duplicates(subset='url', keep='first')
    final_count = len(combined_df)
    
    duplicates_removed = initial_count - final_count
    
    logger.info(f"📊 DataFrame merge completed:")
    logger.info(f"   📥 Total articles before merge: {initial_count}")
    logger.info(f"   🔄 Duplicates removed: {duplicates_removed}")
    logger.info(f"   📊 Final unique articles: {final_count}")
    
    # Log source distribution
    if 'source_type' in combined_df.columns:
        source_counts = combined_df['source_type'].value_counts()
        logger.info(f"   📡 Source distribution: {source_counts.to_dict()}")
    
    return combined_df


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
