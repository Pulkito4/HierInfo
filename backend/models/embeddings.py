"""Embedding model management for semantic operations."""
import logging
from typing import List, Optional, Union
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import os

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Manages the sentence transformer model for generating embeddings."""
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', cache_dir: Optional[str] = None):
        self.model_name = model_name
        self.cache_dir = cache_dir or os.path.join(os.getcwd(), 'model_cache')
        
        # ========================================
        # 🚀 GPU ACCELERATION SETUP
        # ========================================
        # This will automatically detect and use GPU if available
        # For local development with GPU, this should use CUDA
        # For deployment without GPU, this will fallback to CPU
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = None
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🎯 GPU DETECTED: Using {gpu_name} ({gpu_memory:.1f}GB) for embeddings")
        else:
            logger.info(f"💻 Using CPU for embeddings (no GPU available)")
        
        logger.info(f"EmbeddingModel initialized with device: {self.device}")
    
    @property
    def model(self) -> SentenceTransformer:
        """Lazy load the model."""
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            try:
                self._model = SentenceTransformer(
                    self.model_name, 
                    device=self.device,
                    cache_folder=self.cache_dir
                )
                logger.info(f"Model loaded successfully. Embedding dimension: {self.embedding_dim}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise
        return self._model
    
    @property
    def embedding_dim(self) -> int:
        """Get the embedding dimension."""
        return self.model.get_sentence_embedding_dimension()
    
    def encode(self, 
               texts: Union[str, List[str]], 
               batch_size: int = 32, 
               normalize_embeddings: bool = True,
               show_progress_bar: bool = False) -> np.ndarray:
        """
        Encode texts into embeddings.
        
        Args:
            texts: Single text or list of texts to encode
            batch_size: Batch size for processing
            normalize_embeddings: Whether to normalize embeddings
            show_progress_bar: Whether to show progress bar
            
        Returns:
            Array of embeddings
        """
        try:
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                normalize_embeddings=normalize_embeddings,
                show_progress_bar=show_progress_bar,
                convert_to_numpy=True
            )
            
            logger.debug(f"Generated embeddings for {len(texts) if isinstance(texts, list) else 1} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error encoding texts: {e}")
            raise
    
    def encode_single(self, text: str) -> np.ndarray:
        """
        Encode a single text into embedding.
        
        Args:
            text: Text to encode
            
        Returns:
            Embedding array
        """
        return self.encode([text])[0]
    
    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Cosine similarity score
        """
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Reshape for sklearn if needed
        if embedding1.ndim == 1:
            embedding1 = embedding1.reshape(1, -1)
        if embedding2.ndim == 1:
            embedding2 = embedding2.reshape(1, -1)
            
        return cosine_similarity(embedding1, embedding2)[0][0]
    
    def find_similar_texts(self, 
                          query_text: str, 
                          candidate_texts: List[str], 
                          top_k: int = 5,
                          threshold: float = 0.5) -> List[tuple]:
        """
        Find similar texts to a query.
        
        Args:
            query_text: Text to find similarities for
            candidate_texts: List of candidate texts
            top_k: Number of top results to return
            threshold: Minimum similarity threshold
            
        Returns:
            List of (text, similarity_score) tuples
        """
        # Encode all texts
        all_texts = [query_text] + candidate_texts
        embeddings = self.encode(all_texts, show_progress_bar=len(all_texts) > 100)
        
        query_embedding = embeddings[0:1]
        candidate_embeddings = embeddings[1:]
        
        # Calculate similarities
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(query_embedding, candidate_embeddings)[0]
        
        # Create pairs and sort
        text_sim_pairs = list(zip(candidate_texts, similarities))
        text_sim_pairs = [(text, sim) for text, sim in text_sim_pairs if sim >= threshold]
        text_sim_pairs.sort(key=lambda x: x[1], reverse=True)
        
        return text_sim_pairs[:top_k]
    
    def cluster_texts(self, 
                     texts: List[str], 
                     method: str = 'kmeans',
                     n_clusters: Optional[int] = None) -> List[int]:
        """
        Cluster texts based on semantic similarity.
        
        Args:
            texts: List of texts to cluster
            method: Clustering method ('kmeans' or 'dbscan')
            n_clusters: Number of clusters for kmeans
            
        Returns:
            List of cluster labels
        """
        if len(texts) < 2:
            return [0] * len(texts)
        
        # Generate embeddings
        embeddings = self.encode(texts, show_progress_bar=len(texts) > 100)
        
        if method == 'kmeans':
            from sklearn.cluster import KMeans
            
            if n_clusters is None:
                # Estimate number of clusters
                n_clusters = min(max(len(texts) // 10, 2), 20)
            
            clustering = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = clustering.fit_predict(embeddings)
            
        elif method == 'dbscan':
            from sklearn.cluster import DBSCAN
            
            clustering = DBSCAN(eps=0.3, min_samples=2, metric='cosine')
            labels = clustering.fit_predict(embeddings)
            
        else:
            raise ValueError(f"Unknown clustering method: {method}")
        
        return labels.tolist()
    
    def get_text_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """
        Extract keywords from text using embedding-based approach.
        
        Args:
            text: Input text
            top_k: Number of keywords to extract
            
        Returns:
            List of keywords
        """
        try:
            from keybert import KeyBERT
            
            # Use the same embedding model for consistency
            kw_model = KeyBERT(model=self.model)
            
            keywords = kw_model.extract_keywords(
                text,
                keyphrase_ngram_range=(1, 2),
                stop_words='english',
                top_k=top_k,
                use_mmr=True,
                diversity=0.5
            )
            
            return [kw[0] for kw in keywords]
            
        except ImportError:
            logger.warning("KeyBERT not available. Install with: pip install keybert")
            return []
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []
    
    def save_embeddings(self, embeddings: np.ndarray, filepath: str):
        """Save embeddings to file."""
        np.save(filepath, embeddings)
        logger.info(f"Embeddings saved to {filepath}")
    
    def load_embeddings(self, filepath: str) -> np.ndarray:
        """Load embeddings from file."""
        embeddings = np.load(filepath)
        logger.info(f"Embeddings loaded from {filepath}")
        return embeddings
    
    def get_model_info(self) -> dict:
        """Get information about the model."""
        return {
            'model_name': self.model_name,
            'embedding_dimension': self.embedding_dim,
            'device': self.device,
            'model_loaded': self._model is not None
        }