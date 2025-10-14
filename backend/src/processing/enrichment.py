import pandas as pd
import re
from src import constants as C
from utils import get_logger

logger = get_logger(__name__)

# Precompile critical phrases pattern once at import time (case-insensitive)
CRITICAL_PATTERN = re.compile("|".join(C.CRITICAL_NEWS_PHRASES), re.IGNORECASE)


def set_critical_flag(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sets the 'is_critical' flag based on a hybrid strategy:
    1. The article's content must contain a critical news phrase.
    2. The article's trending_score must be above a set threshold.

    Args:
        df (pd.DataFrame): The DataFrame after summarization and deduplication.

    Returns:
        pd.DataFrame: The DataFrame with the 'is_critical' column updated.
    """
    if df.empty:
        logger.warning("DataFrame is empty. Skipping critical flag check.")
        return df

    logger.info("Checking for critical news conditions...")

    # Condition 1: Check for keywords in either the title or the raw_content
    contains_critical_phrase = df["title"].str.contains(
        CRITICAL_PATTERN, na=False, regex=True
    ) | df["raw_content"].str.contains(CRITICAL_PATTERN, na=False, regex=True)

    # Condition 2: Check if the trending score is above the threshold
    is_trending_enough = df["trending_score"] >= C.CRITICAL_TRENDING_THRESHOLD

    # Final check: Both conditions must be true
    df["is_critical"] = contains_critical_phrase & is_trending_enough

    critical_count = df["is_critical"].sum()
    if critical_count > 0:
        logger.info(f"✅ Flagged {critical_count} articles as critical.")
    else:
        logger.info("No articles met the criteria for being critical.")

    return df
