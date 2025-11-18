import pandas as pd
from transformers import pipeline, logging as hf_logging
from tqdm import tqdm
import torch
from src import config as cfg
from utils import get_logger
from src import constants as C
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor, as_completed

# Suppress verbose warnings from Hugging Face to keep logs clean
hf_logging.set_verbosity_error()

logger = get_logger(__name__)

# --- MODEL INITIALIZATION (LAZY) ---
# Lazy loading: model is created when needed, not at import time
classifier_pipeline = None


def _ensure_classifier():
    """Ensure the module-level classifier_pipeline is initialized in the main process."""
    global classifier_pipeline
    if classifier_pipeline is None:
        try:
            logger.info(
                f"🤖 Loading Zero-Shot Classification model '{cfg.CLASSIFIER_MODEL_NAME}'..."
            )
            # Auto-detect GPU: device=0 for CUDA GPU, device=-1 for CPU
            device = 0 if torch.cuda.is_available() else -1
            classifier_pipeline = pipeline(
                "zero-shot-classification", model=cfg.CLASSIFIER_MODEL_NAME, device=device
            )
            device_name = "GPU (CUDA)" if device == 0 else "CPU"
            logger.info(f"✅ Zero-Shot Classification model loaded successfully on {device_name}.")
        except Exception as e:
            logger.critical(f"❌ Failed to load classification model: {e}")
            raise


# --- Parallel worker support ---
def _worker_init_categorizer(model_name: str):
    """Initializer for worker processes: load the classification model once per worker."""
    try:
        hf_logging.set_verbosity_error()
        global classifier_pipeline
        # Auto-detect GPU: device=0 for CUDA GPU, device=-1 for CPU
        device = 0 if torch.cuda.is_available() else -1
        classifier_pipeline = pipeline("zero-shot-classification", model=model_name, device=device)
    except Exception as e:
        print(f"Worker failed to initialize classifier model: {e}")


def _worker_categorize(summary: str, candidate_labels: list) -> list:
    """Worker wrapper that categorizes a single summary."""
    try:
        if not summary or len(summary.strip()) < 20:
            return []
        
        # Ensure pipeline exists in this worker process
        if 'classifier_pipeline' not in globals() or classifier_pipeline is None:
            return []
        
        result = classifier_pipeline(summary, candidate_labels, multi_label=True)
        
        threshold = 0.50
        top_categories = [
            label
            for label, score in zip(result["labels"], result["scores"])
            if score > threshold
        ]
        
        if not top_categories and result["labels"]:
            top_categories = [result["labels"][0]]
        
        return top_categories
    except Exception as e:
        print(f"Worker categorization error: {e}")
        return []


def generate_categories(df: pd.DataFrame) -> pd.DataFrame:
    """Assigns categories to articles using a lightweight Zero-Shot model."""
    if df.empty or "summary" not in df.columns:
        logger.warning(
            "DataFrame is empty or missing 'summary'. Skipping categorization."
        )
        return df

    logger.info(f"🚀 Starting categorization for {len(df)} unique articles...")
    candidate_labels = C.ARTICLE_CATEGORIES
    if not candidate_labels:
        logger.error("❌ No ARTICLE_CATEGORIES defined in config. Skipping.")
        df["categories"] = [[] for _ in range(len(df))]
        return df

    # Ensure model is loaded for sequential execution
    _ensure_classifier()

    tqdm.pandas(desc="Assigning Categories")

    def safe_categorize(row):
        try:
            summary = row["summary"]
            if not summary or len(summary.strip()) < 20:
                return []

            result = classifier_pipeline(summary, candidate_labels, multi_label=True)

            threshold = 0.50
            top_categories = [
                label
                for label, score in zip(result["labels"], result["scores"])
                if score > threshold
            ]

            if not top_categories and result["labels"]:
                top_categories = [result["labels"][0]]

            return top_categories
        except Exception as e:
            logger.error(f"Error categorizing article {row.get('url', 'N/A')}: {e}")
            return []

    df["categories"] = df.progress_apply(safe_categorize, axis=1)
    logger.info("✅ Categorization complete.")
    return df


def generate_categories_parallel(df: pd.DataFrame, max_workers: int = None) -> pd.DataFrame:
    """Parallel version of categorization using a process pool.
    
    Args:
        df: DataFrame with 'summary' column.
        max_workers: Number of worker processes. If None, uses max(1, cpu_count()-1).
    Returns:
        DataFrame with a new 'categories' column.
    """
    if df.empty or "summary" not in df.columns:
        logger.warning("DataFrame is empty or missing 'summary'. Skipping.")
        return df
    
    candidate_labels = C.ARTICLE_CATEGORIES
    if not candidate_labels:
        logger.error("❌ No ARTICLE_CATEGORIES defined. Skipping.")
        df["categories"] = [[] for _ in range(len(df))]
        return df
    
    if max_workers is None:
        max_workers = max(1, mp.cpu_count() - 1)
    
    logger.info(f"🚀 Starting PARALLEL categorization with {max_workers} workers for {len(df)} articles...")
    
    summaries = df["summary"].tolist()
    results = [[]] * len(summaries)
    
    with ProcessPoolExecutor(max_workers=max_workers, initializer=_worker_init_categorizer, initargs=(cfg.CLASSIFIER_MODEL_NAME,)) as executor:
        future_to_idx = {
            executor.submit(_worker_categorize, summary, candidate_labels): idx 
            for idx, summary in enumerate(summaries)
        }
        
        for future in tqdm(as_completed(future_to_idx), total=len(summaries), desc="Categorizing"):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                logger.error(f"Worker failed for article {idx}: {e}")
                results[idx] = []
    
    df["categories"] = results
    logger.info(f"✅ Parallel categorization complete for {len(df)} articles.")
    return df
