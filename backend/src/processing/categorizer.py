import pandas as pd
from transformers import pipeline, logging as hf_logging
from tqdm import tqdm
from src import config as cfg
from utils import get_logger
from src import constants as C

# Suppress verbose warnings from Hugging Face to keep logs clean
hf_logging.set_verbosity_error()

logger = get_logger(__name__)

# --- MODEL INITIALIZATION ---
try:
    # This now loads our new, lightweight model
    logger.info(f"🤖 Loading Zero-Shot Classification model '{cfg.CLASSIFIER_MODEL_NAME}'...")
    classifier_pipeline = pipeline(
        "zero-shot-classification",
        model=cfg.CLASSIFIER_MODEL_NAME,
        device=-1
    )
    logger.info("✅ Zero-Shot Classification model loaded successfully.")
except Exception as e:
    logger.critical(f"❌ Failed to load classification model: {e}")
    raise

def generate_categories(df: pd.DataFrame) -> pd.DataFrame:
    """Assigns categories to articles using a lightweight Zero-Shot model."""
    if df.empty or 'summary' not in df.columns:
        logger.warning("DataFrame is empty or missing 'summary'. Skipping categorization.")
        return df

    logger.info(f"🚀 Starting categorization for {len(df)} unique articles...")
    candidate_labels = C.ARTICLE_CATEGORIES
    if not candidate_labels:
        logger.error("❌ No ARTICLE_CATEGORIES defined in config. Skipping.")
        df['categories'] = [[] for _ in range(len(df))]
        return df

    tqdm.pandas(desc="Assigning Categories")

    def safe_categorize(row):
        try:
            summary = row['summary']
            if not summary or len(summary.strip()) < 20:
                return []

            result = classifier_pipeline(summary, candidate_labels, multi_label=True)
            
            threshold = 0.50
            top_categories = [
                label for label, score in zip(result['labels'], result['scores']) if score > threshold
            ]
            
            if not top_categories and result['labels']:
                top_categories = [result['labels'][0]]
            
            return top_categories
        except Exception as e:
            logger.error(f"Error categorizing article {row.get('url', 'N/A')}: {e}")
            return []

    df['categories'] = df.progress_apply(safe_categorize, axis=1)
    logger.info("✅ Categorization complete.")
    return df