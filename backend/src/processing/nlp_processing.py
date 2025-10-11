# src/processing/nlp_processing.py

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple

# Import NLP libraries
from transformers import pipeline, logging as hf_logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.stem import WordNetLemmatizer
from tqdm import tqdm

# Suppress verbose warnings from Hugging Face
hf_logging.set_verbosity_error()

# Initialize logger (assuming you have a central logging config)
from logging import getLogger
logger = getLogger(__name__)

# --- MODEL INITIALIZATION (Load models only once) ---
# It's crucial to load these models once and reuse them to save memory and time.
try:
    logger.info("🤖 Loading NLP models into memory...")
    summarizer_pipeline = pipeline(
        "summarization",
        model="sshleifer/distilbart-cnn-12-6",
        device=-1  # Use CPU, change to 0 for GPU if available
    )
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    keyword_model = KeyBERT(model=embedding_model)
    lemmatizer = WordNetLemmatizer()
    nltk.download('wordnet', quiet=True)
    logger.info("✅ NLP models loaded successfully.")
except Exception as e:
    logger.critical(f"❌ Failed to load NLP models: {e}")
    # Exit or raise a critical exception if models can't be loaded
    raise

# --- CORE NLP FUNCTIONS ---

def _summarize_text_mapreduce(text: str) -> str:
    """Summarizes long text using a MapReduce strategy."""
    # 1. Split text into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(text)

    # 2. Summarize each chunk
    partial_summaries = []
    for chunk in chunks:
        summary = summarizer_pipeline(
            chunk, max_length=120, min_length=30, do_sample=False
        )[0]['summary_text']
        partial_summaries.append(summary)

    # 3. Combine and produce a final summary
    combined_summary_text = " ".join(partial_summaries)
    final_summary = summarizer_pipeline(
        combined_summary_text, max_length=200, min_length=50, do_sample=False
    )[0]['summary_text']

    return final_summary

def _extract_diverse_keywords(text: str, top_n: int = 8) -> List[str]:
    """Extracts high-quality, diverse keywords, avoiding repetition."""
    avoid_words = {'said', 'reported', 'according', 'added', 'news', 'people'}
    candidates = keyword_model.extract_keywords(
        text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=20
    )

    final_keywords = []
    used_lemmas = set()
    for keyword, score in candidates:
        if len(final_keywords) >= top_n:
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

def _generate_categories_from_keywords(keywords: List[str], max_categories: int = 4) -> List[str]:
    """Generates categories by finding the most representative keywords via clustering."""
    if not keywords or len(keywords) <= max_categories:
        return keywords

    embeddings = embedding_model.encode(keywords)
    num_clusters = min(max_categories, len(keywords))

    kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(embeddings)

    categories = []
    for i in range(num_clusters):
        cluster_indices = np.where(cluster_labels == i)[0]
        if len(cluster_indices) == 0:
            continue
        
        cluster_embeddings = embeddings[cluster_indices]
        cluster_center = np.mean(cluster_embeddings, axis=0)
        
        # Find the keyword closest to the center of the cluster
        distances = cosine_similarity(cluster_embeddings, [cluster_center])
        most_central_idx = cluster_indices[np.argmax(distances)]
        categories.append(keywords[most_central_idx])

    return categories

# --- MAIN DATAFRAME PROCESSING FUNCTION ---

def apply_nlp_processing(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the full NLP pipeline (summarization, keywords, categories) to a DataFrame.

    Args:
        df (pd.DataFrame): The cleaned DataFrame ready for NLP processing.

    Returns:
        pd.DataFrame: The DataFrame enriched with NLP data.
    """
    if df.empty:
        logger.warning("Input DataFrame is empty. Skipping NLP processing.")
        return df

    logger.info(f"🚀 Starting NLP processing for {len(df)} articles...")
    
    # Use tqdm for a progress bar in the console
    tqdm.pandas(desc="Processing Articles")

    def process_row(row):
        text = row['raw_content']
        try:
            summary = _summarize_text_mapreduce(text)
            keywords = _extract_diverse_keywords(text)
            categories = _generate_categories_from_keywords(keywords)
            return summary, keywords, categories
        except Exception as e:
            logger.error(f"Error processing article {row.get('url', 'N/A')}: {e}")
            return "", [], []

    # Apply the function to each row and expand the results into new columns
    nlp_results = df.progress_apply(process_row, axis=1)
    df[['summary', 'keywords', 'categories']] = pd.DataFrame(nlp_results.tolist(), index=df.index)

    logger.info("✅ NLP processing complete.")
    return df