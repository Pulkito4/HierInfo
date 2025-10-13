import pandas as pd
from transformers import pipeline, logging as hf_logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from tqdm import tqdm
from src import config as cfg

from utils import get_logger

# Suppress verbose warnings from Hugging Face to keep logs clean
hf_logging.set_verbosity_error()

# Initialize logger
logger = get_logger(__name__)

# --- MODEL INITIALIZATION ---
# Load the summarization model once when the module is imported.
# This is a crucial optimization to save memory and time.
try:
    logger.info(f"🤖 Loading summarization model '{cfg.SUMMARIZER_MODEL_NAME}' into memory...")
    # device=-1 ensures it uses CPU. Change to 0 for the first GPU if available.
    summarizer_pipeline = pipeline(
        "summarization",
        model=cfg.SUMMARIZER_MODEL_NAME,
        device=-1
    )
    logger.info("✅ Summarization model loaded successfully.")
except Exception as e:
    logger.critical(f"❌ Failed to load summarization model: {e}")
    # This is a critical failure, so we raise the exception to stop the pipeline.
    raise

def _summarize_text_mapreduce(text: str) -> str:
    """
    (Internal) Summarizes long text using a MapReduce strategy.
    
    Args:
        text (str): The raw article content to summarize.

    Returns:
        str: The final, coherent summary.
    """
    if not text or not isinstance(text, str) or len(text.strip()) < 200:
        logger.debug("Skipping summary for short or invalid text.")
        return "" # Return empty string for short or empty content

    # 1. Split text into manageable, overlapping chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1024, # Max tokens for the DistilBART model
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(text)

    # 2. Summarize each chunk individually (Map step)
    partial_summaries = summarizer_pipeline(
        chunks, max_length=120, min_length=30, do_sample=False
    )
    
    # 3. Combine partial summaries and produce a final summary (Reduce step)
    combined_summary_text = " ".join([summ['summary_text'] for summ in partial_summaries])
    
    # Run one final summary pass to synthesize the results
    final_summary = summarizer_pipeline(
        combined_summary_text, max_length=200, min_length=50, do_sample=False
    )[0]['summary_text']

    return final_summary

def generate_summaries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the summarization pipeline to the 'raw_content' of each article.

    Args:
        df (pd.DataFrame): The deduplicated DataFrame ready for summarization.

    Returns:
        pd.DataFrame: The DataFrame with a new 'summary' column.
    """
    if df.empty or 'raw_content' not in df.columns:
        logger.warning("DataFrame is empty or missing 'raw_content'. Skipping summarization.")
        return df

    logger.info(f"🚀 Starting summary generation for {len(df)} unique articles...")
    
    # Initialize tqdm for a progress bar in the console
    tqdm.pandas(desc="Generating Summaries")

    # Apply the summarization function to each row
    # A try-except block ensures one failed article doesn't stop the whole pipeline
    def safe_summarize(row):
        try:
            return _summarize_text_mapreduce(row['raw_content'])
        except Exception as e:
            logger.error(f"Error summarizing article {row.get('url', 'N/A')}: {e}")
            return "" # Return empty string on failure

    df['summary'] = df.progress_apply(safe_summarize, axis=1)

    logger.info("✅ Summary generation complete.")
    return df