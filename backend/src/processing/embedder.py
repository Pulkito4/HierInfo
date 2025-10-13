import pandas as pd
from sentence_transformers import SentenceTransformer
from utils import get_logger
from src import config as cfg


logger = get_logger(__name__)

# --- MODEL INITIALIZATION ---
# Load the model once when the module is imported to save time and memory.
try:
    logger.info(f"🤖 Loading embedding model '{cfg.EMBEDDING_MODEL_NAME}' into memory...")
    # You can specify a cache directory to save the model locally
    # model = SentenceTransformer(cfg.EMBEDDING_MODEL_NAME, cache_folder='./model_cache')
    model = SentenceTransformer(cfg.EMBEDDING_MODEL_NAME)
    logger.info("✅ Embedding model loaded successfully.")
except Exception as e:
    logger.critical(f"❌ Failed to load embedding model: {e}")
    # This is a critical failure, so we raise the exception to stop the pipeline.
    raise

def generate_embeddings(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates vector embeddings for the 'raw_content' of each article in the DataFrame.

    Args:
        df (pd.DataFrame): The main DataFrame containing the raw article content.

    Returns:
        pd.DataFrame: The DataFrame with a new 'embedding' column.
    """
    if df.empty:
        logger.warning("Input DataFrame is empty. Skipping embedding generation.")
        return df

    # Check if 'raw_content' column exists and is not empty
    if 'raw_content' not in df.columns or df['raw_content'].isnull().all():
        logger.error("❌ 'raw_content' column is missing or empty. Cannot generate embeddings.")
        # Return the original DataFrame without the embedding column
        return df

    logger.info(f"🚀 Starting embedding generation for {len(df)} articles...")

    try:
        # Get the list of texts to embed. Fill any missing content with an empty string.
        texts_to_embed = df['raw_content'].fillna('').tolist()

        # The .encode() method is highly optimized to process a batch of texts at once.
        # It will automatically use the GPU if one is available and CUDA is set up.
        embeddings = model.encode(texts_to_embed, show_progress_bar=True)

        # Add the generated embeddings as a new column to the DataFrame.
        # The column will contain lists (or numpy arrays) of numbers.
        df['embedding'] = list(embeddings)

        logger.info("✅ Embedding generation complete.")
        return df
        
    except Exception as e:
        logger.error(f"❌ An error occurred during embedding generation: {e}")
        # In case of an error, return the original DataFrame to avoid partial processing
        return df