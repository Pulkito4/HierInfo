"""
Deduplication and clustering functions.
"""

import logging
from typing import List, Dict, Set
from .embeddings import calculate_similarity
import hashlib

logger = logging.getLogger(__name__)


def create_content_hash(article: Dict) -> str:
    """
    Create a hash of article content for duplicate detection.

    Args:
        article: Article dictionary

    Returns:
        MD5 hash of content
    """
    title = article.get("title", "").strip().lower()
    content = article.get("content", "").strip().lower()

    # Create hash from title + first 500 chars of content
    content_for_hash = f"{title}{content[:500]}"
    return hashlib.md5(content_for_hash.encode()).hexdigest()


def remove_exact_duplicates(articles: List[Dict]) -> List[Dict]:
    """
    Remove articles with identical content hashes.

    Args:
        articles: List of article dictionaries

    Returns:
        Deduplicated list of articles
    """
    seen_hashes: Set[str] = set()
    unique_articles = []

    for article in articles:
        content_hash = create_content_hash(article)

        if content_hash not in seen_hashes:
            seen_hashes.add(content_hash)
            article["content_hash"] = content_hash
            unique_articles.append(article)

    logger.info(f"Removed {len(articles) - len(unique_articles)} exact duplicates")
    return unique_articles


def remove_similar_articles(
    articles: List[Dict], similarity_threshold: float = 0.85
) -> List[Dict]:
    """
    Remove articles that are too similar based on embeddings.

    Args:
        articles: List of article dictionaries with embeddings
        similarity_threshold: Similarity threshold for considering articles duplicates

    Returns:
        List of unique articles
    """
    if not articles:
        return articles

    # Filter articles that have embeddings
    articles_with_embeddings = [
        article for article in articles if article.get("embedding") is not None
    ]

    if len(articles_with_embeddings) <= 1:
        return articles

    unique_articles = []
    processed_indices = set()

    for i, article in enumerate(articles_with_embeddings):
        if i in processed_indices:
            continue

        is_unique = True

        # Compare with already selected unique articles
        for unique_article in unique_articles:
            similarity = calculate_similarity(
                article["embedding"], unique_article["embedding"]
            )

            if similarity >= similarity_threshold:
                is_unique = False
                break

        if is_unique:
            unique_articles.append(article)
            processed_indices.add(i)

    # Add articles without embeddings
    articles_without_embeddings = [
        article for article in articles if article.get("embedding") is None
    ]
    unique_articles.extend(articles_without_embeddings)

    logger.info(
        f"Removed {len(articles_with_embeddings) - len([a for a in unique_articles if a.get('embedding')])} similar articles"
    )
    return unique_articles


def cluster_similar_articles(
    articles: List[Dict], similarity_threshold: float = 0.7
) -> List[Dict]:
    """
    Group similar articles into clusters and mark cluster information.

    Args:
        articles: List of article dictionaries with embeddings
        similarity_threshold: Similarity threshold for clustering

    Returns:
        Articles with cluster information added
    """
    if not articles:
        return articles

    # Filter articles that have embeddings
    articles_with_embeddings = [
        (i, article)
        for i, article in enumerate(articles)
        if article.get("embedding") is not None
    ]

    if len(articles_with_embeddings) <= 1:
        # No clustering needed, assign individual cluster IDs
        for i, article in enumerate(articles):
            article["cluster_id"] = i
            article["cluster_size"] = 1
        return articles

    clusters = []
    processed_indices = set()

    for i, (orig_idx, article) in enumerate(articles_with_embeddings):
        if orig_idx in processed_indices:
            continue

        # Start new cluster with this article
        cluster = [orig_idx]
        processed_indices.add(orig_idx)

        # Find similar articles
        for j, (other_orig_idx, other_article) in enumerate(
            articles_with_embeddings[i + 1 :], i + 1
        ):
            if other_orig_idx in processed_indices:
                continue

            similarity = calculate_similarity(
                article["embedding"], other_article["embedding"]
            )

            if similarity >= similarity_threshold:
                cluster.append(other_orig_idx)
                processed_indices.add(other_orig_idx)

        clusters.append(cluster)

    # Assign cluster information
    for cluster_id, cluster_indices in enumerate(clusters):
        for article_idx in cluster_indices:
            articles[article_idx]["cluster_id"] = cluster_id
            articles[article_idx]["cluster_size"] = len(cluster_indices)

    # Handle articles without embeddings
    for i, article in enumerate(articles):
        if article.get("cluster_id") is None:
            article["cluster_id"] = len(clusters) + i
            article["cluster_size"] = 1

    logger.info(
        f"Formed {len(clusters)} clusters from {len(articles_with_embeddings)} articles"
    )
    return articles


def deduplicate_articles(
    articles: List[Dict], similarity_threshold: float = 0.85
) -> List[Dict]:
    """
    Complete deduplication pipeline: exact duplicates + similarity-based.

    Args:
        articles: List of article dictionaries
        similarity_threshold: Similarity threshold for considering articles duplicates

    Returns:
        Deduplicated list of articles
    """
    logger.info(f"Starting deduplication of {len(articles)} articles")

    # Step 1: Remove exact duplicates
    unique_articles = remove_exact_duplicates(articles)

    # Step 2: Remove similar articles based on embeddings
    if len(unique_articles) > 1:
        unique_articles = remove_similar_articles(unique_articles, similarity_threshold)

    logger.info(
        f"Deduplication complete: {len(articles)} → {len(unique_articles)} articles"
    )
    return unique_articles
