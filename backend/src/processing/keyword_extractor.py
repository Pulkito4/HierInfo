import pandas as pd
from keybert import KeyBERT
from tqdm import tqdm
import nltk
from nltk.stem import WordNetLemmatizer
from utils import get_logger
from src.processing.embedder import model as embedding_model

logger = get_logger(__name__)

# --- MODEL INITIALIZATION ---
try:
    logger.info("🤖 Initializing KeyBERT with the pre-loaded embedding model...")
    kw_model = KeyBERT(model=embedding_model)
    lemmatizer = WordNetLemmatizer()
    nltk.download('wordnet', quiet=True)
    logger.info("✅ KeyBERT and NLTK WordNet initialized successfully.")
except Exception as e:
    logger.critical(f"❌ Failed to initialize KeyBERT or NLTK: {e}")
    raise

def _extract_and_clean_keywords(text: str) -> list:
    """(Internal) Extracts high-quality, diverse keywords and cleans them."""
    if not text or len(text.strip()) < 200:
        return []

    avoid_words = {'said', 'reported', 'according', 'added', 'news', 'people'}
    
    candidates = kw_model.extract_keywords(
        text, keyphrase_ngram_range=(1, 3), stop_words='english',
        use_mmr=True, diversity=0.7, top_n=15
    )
    if not candidates:
        return []

    final_keywords = []
    used_lemmas = set()
    
    for keyword, score in candidates:
        if len(final_keywords) >= 8: # Stop once we have 8 good keywords
            break

        clean_kw = keyword.strip().lower()
        if any(avoid in clean_kw for avoid in avoid_words) or len(clean_kw) < 4:
            continue

        words = clean_kw.split()
        lemma_signature = tuple(sorted([lemmatizer.lemmatize(w) for w in words]))
        if lemma_signature in used_lemmas:
            continue
        
        is_redundant = any(clean_kw in ex.lower() or ex.lower() in clean_kw for ex in final_keywords)
        if not is_redundant:
            final_keywords.append(' '.join(word.capitalize() for word in words))
            used_lemmas.add(lemma_signature)

    return final_keywords

def generate_keywords(df: pd.DataFrame) -> pd.DataFrame:
    """Applies KeyBERT to extract, clean, and add relevant keywords to the DataFrame."""
    if df.empty or 'raw_content' not in df.columns:
        logger.warning("DataFrame is empty or missing 'raw_content'. Skipping keyword extraction.")
        return df

    logger.info(f"🚀 Starting keyword extraction for {len(df)} unique articles...")
    tqdm.pandas(desc="Extracting Keywords")

    def safe_extract(row):
        try:
            return _extract_and_clean_keywords(row['raw_content'])
        except Exception as e:
            logger.error(f"Error extracting keywords for article {row.get('url', 'N/A')}: {e}")
            return []

    df['keywords'] = df.progress_apply(safe_extract, axis=1)
    logger.info("✅ Keyword extraction complete.")
    return df