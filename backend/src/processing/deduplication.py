import pandas as pd
import numpy as np
import hdbscan
from src import config as cfg
from utils import get_logger

logger = get_logger(__name__)

def _rank_source(source_name: str) -> int:
    """
    Ranks a source using a hybrid strategy: a priority map and a rule-based scorer.

    Args:
        source_name (str): The name of the news source.

    Returns:
        int: A rank score. Lower is better.
    """
    # 1. Check the "VIP List" first
    if source_name in cfg.SOURCE_PRIORITY_MAP:
        return cfg.SOURCE_PRIORITY_MAP[source_name]

    # 2. If not found, use the rule-based scorer
    score = cfg.SOURCE_SCORING_RULES['base_score']
    
    for keyword, value in cfg.SOURCE_SCORING_RULES['keywords'].items():
        if keyword.lower() in source_name.lower():
            score += value # Add or subtract points based on keyword

    return score


def cluster_and_deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clusters articles and selects the best one from each cluster using a hybrid ranking system.
    """
    if df.empty or 'embedding' not in df.columns or df['embedding'].isnull().all():
        logger.warning("DataFrame is empty or missing embeddings. Skipping deduplication.")
        return df

    logger.info(f"🚀 Starting clustering and deduplication for {len(df)} articles...")

     # --- 1. Perform HDBSCAN Clustering ---
    embeddings = np.array(df['embedding'].tolist())
    clusterer = hdbscan.HDBSCAN(min_cluster_size=2, metric='euclidean', cluster_selection_method='eom')
    df['cluster_label'] = clusterer.fit_predict(embeddings)

    # --- 2. Calculate Trending Score from Clusters ---
    # Initialize all scores to 1 (for unique/noise articles)
    df['trending_score'] = 1
    
    unique_clusters = [label for label in df['cluster_label'].unique() if label != -1]
    
    # This dictionary will store {index_of_best_article: trending_score}
    best_articles_with_scores = {}

    for cluster_id in unique_clusters:
        cluster_df = df[df['cluster_label'] == cluster_id]
        
        # The trending score IS the size of the cluster
        trending_score = len(cluster_df)

        cluster_df = cluster_df.assign(source_rank=cluster_df['source_name'].apply(_rank_source))
        sorted_cluster = cluster_df.sort_values(by=['source_rank', 'published_at'])
        
        best_article_index = sorted_cluster.index[0]
        best_articles_with_scores[best_article_index] = trending_score

    # Update the trending_score for the selected best articles
    for index, score in best_articles_with_scores.items():
        df.loc[index, 'trending_score'] = score
        
    # --- 3. Select Final Articles ---
    best_article_indices = list(best_articles_with_scores.keys())
    noise_indices = df[df['cluster_label'] == -1].index.tolist()
    final_indices_to_keep = best_article_indices + noise_indices
    
    deduplicated_df = df.loc[final_indices_to_keep].copy()
    
    # Clean up temporary columns
    deduplicated_df.drop(columns=['cluster_label', 'source_rank'], inplace=True, errors='ignore')

    logger.info(f"✅ Deduplication complete. Selected {len(deduplicated_df)} unique articles.")
    return deduplicated_df