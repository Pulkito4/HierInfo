"""
Text embedding functions using sentence-transformers.
"""

import logging
from typing import List, Dict
import torch
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)

# Global model instance for reuse
_embedding_model = None


def initialize_embedding_model(
    model_name: str = "all-MiniLM-L6-v2",
) -> SentenceTransformer:
    """
    Initialize the embedding model with GPU support if available.

    Args:
        model_name: Name of the sentence-transformers model

    Returns:
        Initialized SentenceTransformer model
    """
    global _embedding_model

    if _embedding_model is not None:
        return _embedding_model

    try:
        # Check for GPU
        device = "cuda" if torch.cuda.is_available() else "cpu"

        if device == "cuda":
            gpu_name = torch.cuda.get_device_name(0)
            memory_gb = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(
                f"🎯 GPU DETECTED: Using {gpu_name} ({memory_gb:.1f}GB) for embeddings"
            )
        else:
            logger.info("💻 Using CPU for embeddings")

        # Load model
        logger.info(f"Loading embedding model: {model_name}")
        model = SentenceTransformer(model_name, device=device)

        logger.info(
            f"Model loaded successfully. Embedding dimension: {model.get_sentence_embedding_dimension()}"
        )

        _embedding_model = model
        return model

    except Exception as e:
        logger.error(f"Error initializing embedding model: {e}")
        raise


def generate_text_embeddings(
    texts: List[str], batch_size: int = 32
) -> List[List[float]]:
    """
    Generate embeddings for a list of texts.

    Args:
        texts: List of text strings to embed
        batch_size: Batch size for processing

    Returns:
        List of embedding vectors
    """
    if not texts:
        return []

    model = initialize_embedding_model()

    try:
        logger.info(f"Generating embeddings for {len(texts)} texts")

        # Generate embeddings in batches
        embeddings = model.encode(
            texts, batch_size=batch_size, show_progress_bar=False, convert_to_numpy=True
        )

        # Convert to list format for JSON serialization
        embeddings_list = [embedding.tolist() for embedding in embeddings]

        logger.info(f"Generated {len(embeddings_list)} embeddings")
        return embeddings_list

    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return []


def add_embeddings_to_articles(articles: List[Dict]) -> List[Dict]:
    """
    Add embedding vectors to articles based on their content.

    Args:
        articles: List of article dictionaries

    Returns:
        Articles with added embedding vectors
    """
    if not articles:
        return articles

    # Prepare texts for embedding (title + content)
    texts = []
    valid_indices = []

    for i, article in enumerate(articles):
        title = article.get("title", "")
        content = article.get("content", "")

        # Combine title and content for better embeddings
        combined_text = f"{title}. {content}"

        if combined_text.strip():
            texts.append(combined_text)
            valid_indices.append(i)

    if not texts:
        logger.warning("No valid texts found for embedding generation")
        return articles

    # Generate embeddings
    embeddings = generate_text_embeddings(texts)

    # Add embeddings to articles
    articles_with_embeddings = []
    for i, article in enumerate(articles):
        article_copy = article.copy()

        if i in valid_indices:
            embedding_idx = valid_indices.index(i)
            if embedding_idx < len(embeddings):
                article_copy["embedding"] = embeddings[embedding_idx]
            else:
                article_copy["embedding"] = None
        else:
            article_copy["embedding"] = None

        articles_with_embeddings.append(article_copy)

    logger.info(
        f"Added embeddings to {len([a for a in articles_with_embeddings if a.get('embedding')])}/{len(articles)} articles"
    )
    return articles_with_embeddings


def calculate_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Calculate cosine similarity between two embeddings.

    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector

    Returns:
        Cosine similarity score (0-1)
    """
    try:
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Cosine similarity
        dot_product = np.dot(vec1, vec2)
        norms = np.linalg.norm(vec1) * np.linalg.norm(vec2)

        if norms == 0:
            return 0.0

        similarity = dot_product / norms
        return max(0.0, min(1.0, similarity))  # Clamp to [0,1]

    except Exception as e:
        logger.warning(f"Error calculating similarity: {e}")
        return 0.0
