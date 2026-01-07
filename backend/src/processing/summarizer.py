import pandas as pd
from transformers import pipeline, logging as hf_logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from tqdm import tqdm
import torch
from src import config as cfg

from utils import get_logger
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor, as_completed

# Suppress verbose warnings from Hugging Face to keep logs clean
hf_logging.set_verbosity_error()

# Initialize logger
logger = get_logger(__name__)

# --- MODEL INITIALIZATION (LAZY) ---
# We avoid loading the model at import time to make imports lightweight.
# The model is created lazily when needed in the main process via `_ensure_pipeline`,
# and worker processes set `summarizer_pipeline` during their initializer.
summarizer_pipeline = None


def _ensure_pipeline():
    """Ensure the module-level `summarizer_pipeline` is initialized in the main process."""
    global summarizer_pipeline
    if summarizer_pipeline is None:
        try:
            logger.info(
                f"🤖 Loading summarization model '{cfg.SUMMARIZER_MODEL_NAME}' into memory..."
            )
            # Auto-detect GPU: device=0 for CUDA GPU, device=-1 for CPU
            device = 0 if torch.cuda.is_available() else -1
            summarizer_pipeline = pipeline(
                "summarization", model=cfg.SUMMARIZER_MODEL_NAME, device=device
            )
            device_name = "GPU (CUDA)" if device == 0 else "CPU"
            logger.info(f"✅ Summarization model loaded successfully on {device_name}.")
        except Exception as e:
            logger.critical(f"❌ Failed to load summarization model: {e}")
            raise


def _summarize_text_mapreduce(text: str) -> str:
    """
    (Internal) Summarizes long text using a MapReduce strategy.
    For shorter articles (<1000 chars), uses direct summarization to save time.

    Args:
        text (str): The raw article content to summarize.

    Returns:
        str: The final, coherent summary.
    """
    if pd.isna(text) or not isinstance(text, str) or len(text.strip()) < 200:
        logger.debug("Skipping summary for short or invalid text.")
        return ""  # Return empty string for short or empty content

    # Sanitize text to prevent CUDA indexing errors
    # Remove control characters, excessive whitespace, and non-printable chars
    text = text.strip()
    # Replace control characters except newlines/tabs
    import re
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Validate text length after cleaning
    if len(text) < 200:
        logger.debug("Text too short after sanitization.")
        return ""

    # Optimization: Direct summarization for short articles (< 1000 chars = ~400 tokens)
    # This avoids unnecessary chunking and multiple model calls for brief news
    if len(text) < 1000:
        try:
            if 'summarizer_pipeline' not in globals() or summarizer_pipeline is None:
                _ensure_pipeline()
            
            summary = summarizer_pipeline(
                text, 
                max_length=150, 
                min_length=30, 
                do_sample=False, 
                truncation=True
            )[0]["summary_text"]
            return summary
        except Exception as e:
            logger.debug(f"Direct summarization failed, using MapReduce: {e}")
            # Fall through to MapReduce if direct fails

    # 1. Split text into manageable, overlapping chunks
    # Optimized chunk size: 2500 chars (~875 tokens with safety margin) to reduce number of chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2500,  # Increased from 1024 to better utilize DistilBART's 1024 token limit
        chunk_overlap=200,  # Increased proportionally to maintain context
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)

    # 2. Summarize each chunk individually (Map step)
    # Ensure pipeline exists in this process (main process or worker)
    if 'summarizer_pipeline' not in globals() or summarizer_pipeline is None:
        _ensure_pipeline()

    partial_summaries = summarizer_pipeline(
        chunks, max_length=120, min_length=30, do_sample=False
    )

    # 3. Combine partial summaries and produce a final summary (Reduce step)
    combined_summary_text = " ".join(
        [summ["summary_text"] for summ in partial_summaries]
    )

    # Run one final summary pass to synthesize the results for better cohesion
    # This creates a professional, flowing summary instead of disjointed bullet points
    final_summary = summarizer_pipeline(
        combined_summary_text, max_length=200, min_length=50, do_sample=False
    )[0]["summary_text"]

    return final_summary


# --- Parallel worker support ---
# Worker initializer sets up a model instance in each process as `summarizer_pipeline`
def _worker_init(model_name: str):
    """Initializer for worker processes: load the summarization model once per worker."""
    try:
        # Suppress hf logging in worker as well
        hf_logging.set_verbosity_error()
        global summarizer_pipeline
        # Auto-detect GPU: device=0 for CUDA GPU, device=-1 for CPU
        device = 0 if torch.cuda.is_available() else -1
        summarizer_pipeline = pipeline("summarization", model=model_name, device=device)
    except Exception as e:
        # If a worker fails to init, log to stdout (cannot use logger from parent reliably)
        print(f"Worker failed to initialize summarizer model: {e}")


def _worker_summarize(text: str) -> str:
    """Worker wrapper that calls the existing mapreduce summarizer in the worker process."""
    try:
        return _summarize_text_mapreduce(text)
    except Exception as e:
        # Return empty string on worker failure to avoid crashing the whole pool
        print(f"Worker summarization error: {e}")
        return ""


def generate_summaries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the summarization pipeline to the 'raw_content' of each article.

    Args:
        df (pd.DataFrame): The deduplicated DataFrame ready for summarization.

    Returns:
        pd.DataFrame: The DataFrame with a new 'summary' column.
    """
    if df.empty or "raw_content" not in df.columns:
        logger.warning(
            "DataFrame is empty or missing 'raw_content'. Skipping summarization."
        )
        return df

    logger.info(f"🚀 Starting summary generation for {len(df)} unique articles...")

    # Initialize tqdm for a progress bar in the console
    tqdm.pandas(desc="Generating Summaries")

    # Apply the summarization function to each row
    # A try-except block ensures one failed article doesn't stop the whole pipeline
    def safe_summarize(row):
        try:
            return _summarize_text_mapreduce(row["raw_content"])
        except Exception as e:
            logger.error(f"Error summarizing article {row.get('url', 'N/A')}: {e}")
            return ""  # Return empty string on failure

    df["summary"] = df.progress_apply(safe_summarize, axis=1)

    # Filter out articles that failed to generate a summary
    initial_count = len(df)
    df = df[df["summary"].notna() & (df["summary"].str.strip() != "")]
    filtered_count = initial_count - len(df)
    
    if filtered_count > 0:
        logger.warning(
            f"⚠️  Filtered out {filtered_count} articles with no valid summary. "
            f"Remaining: {len(df)} articles."
        )
    
    if df.empty:
        logger.warning("❌ No articles remain after summary filtering.")
        return df

    logger.info(f"✅ Summary generation complete for {len(df)} articles.")
    return df


def generate_summaries_parallel(df: pd.DataFrame, max_workers: int = None) -> pd.DataFrame:
    """
    Parallel version of summarization using a process pool. Each worker initializes
    its own summarization model instance to avoid GIL and achieve true parallelism.

    Args:
        df: DataFrame with 'raw_content' column.
        max_workers: Number of worker processes to use. If None, uses max(1, cpu_count()-1).
    Returns:
        DataFrame with a new 'summary' column (filtered to remove empty summaries).
    """
    if df.empty or "raw_content" not in df.columns:
        logger.warning("DataFrame is empty or missing 'raw_content'. Skipping.")
        return df

    if max_workers is None:
        # leave one CPU free to keep the system responsive
        max_workers = max(1, mp.cpu_count() - 1)

    logger.info(f"🚀 Starting PARALLEL summarization with {max_workers} workers for {len(df)} articles...")

    texts = df["raw_content"].tolist()
    results = [""] * len(texts)

    # Use ProcessPoolExecutor with an initializer that loads the model per worker
    with ProcessPoolExecutor(max_workers=max_workers, initializer=_worker_init, initargs=(cfg.SUMMARIZER_MODEL_NAME,)) as executor:
        future_to_idx = {executor.submit(_worker_summarize, text): idx for idx, text in enumerate(texts)}

        for future in tqdm(as_completed(future_to_idx), total=len(texts), desc="Summarizing"):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                logger.error(f"Worker failed for article {idx}: {e}")
                results[idx] = ""

    df["summary"] = results

    # Filter out empty summaries
    initial_count = len(df)
    df = df[df["summary"].notna() & (df["summary"].str.strip() != "")]
    filtered_count = initial_count - len(df)
    if filtered_count > 0:
        logger.warning(f"Filtered out {filtered_count} articles without summaries")

    if df.empty:
        logger.warning("❌ No articles remain after parallel summary filtering.")
        return df

    logger.info(f"✅ Parallel summarization complete for {len(df)} articles.")
    return df
