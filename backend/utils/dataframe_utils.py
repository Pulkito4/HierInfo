import pandas as pd
from typing import List, Dict, Any
from .logging_config import get_logger

logger = get_logger(__name__)


def get_df_schema() -> Dict[str, Any]:
    """
    Returns the golden schema for the main news DataFrame.
    This ensures consistency across the application.
    """
    return {
        "url": pd.StringDtype(),
        "title": pd.StringDtype(),
        "source_name": pd.StringDtype(),
        "image_url": pd.StringDtype(),
        "raw_content": pd.StringDtype(),
        "summary": pd.StringDtype(),
        "source_type": pd.StringDtype(),
        "parsing_method": pd.StringDtype(),
        "published_at": "datetime64[ns, UTC]",
        "embedding": "object",
        "categories": "object",
        "keywords": "object",
        "trending_score": "int64",
        "is_critical": "bool",
    }


def create_main_dataframe(articles_data: List[Dict]) -> pd.DataFrame:
    """
    Creates the main, standardized news DataFrame from a list of article dictionaries.
    This is the most efficient way to create the DataFrame.

    Args:
        articles_data (List[Dict]): A list of dictionaries, where each dict is a processed article.

    Returns:
        pd.DataFrame: The final, cleaned, and deduplicated DataFrame.
    """
    logger.info(f"🚀 Creating main DataFrame from {len(articles_data)} articles...")

    if not articles_data:
        logger.warning("⚠️ No articles data provided. Returning an empty DataFrame.")
        schema = get_df_schema()
        return pd.DataFrame(columns=schema.keys()).astype(schema)

    # 1. Create DataFrame from the list of dictionaries in one go.
    df = pd.DataFrame(articles_data)

    # 2. Handle missing columns and set default values
    schema = get_df_schema()
    for col, dtype in schema.items():
        if col not in df.columns:
            if dtype in ["object", pd.StringDtype()]:
                df[col] = None  # Use None for object/string types
            elif dtype == "int64":
                df[col] = 0
            elif dtype == "bool":
                df[col] = False
            else:
                df[col] = pd.NA  # Use pandas NA for other types

    # 3. Enforce the schema and column order
    df = df[schema.keys()].astype(schema)

    # 4. Deduplication : handle duplicates based on 'url'
    initial_count = len(df)
    df.drop_duplicates(subset="url", keep="first", inplace=True)
    final_count = len(df)

    duplicates_removed = initial_count - final_count
    logger.info("📊 DataFrame created successfully:")
    logger.info(f"   - Initial article count: {initial_count}")
    logger.info(f"   - Duplicates removed: {duplicates_removed}")
    logger.info(f"   - Final unique articles: {final_count}")

    return df
