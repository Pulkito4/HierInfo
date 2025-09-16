"""NLP processing module for article analysis and enhancement."""
import logging
from typing import List, Dict, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import torch

logger = logging.getLogger(__name__)

class NLPProcessor:
    """Handles all NLP operations for articles."""
    
    def __init__(self):
        # ========================================
        # 🚀 GPU ACCELERATION SETUP
        # ========================================
        # Auto-detect GPU for NLP pipeline
        # This affects ALL NLP models: embeddings, summarization, classification
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🎯 GPU DETECTED: {gpu_name} ({gpu_memory:.1f}GB)")
            logger.info(f"🚀 All NLP models will use GPU for maximum speed!")
        else:
            logger.info(f"💻 No GPU detected - using CPU (will be slower)")
        
        logger.info(f"NLPProcessor initialized with device: {self.device}")
        
        # Initialize models lazily
        self._embedding_model = None
        self._summarization_pipeline = None
        self._classification_pipeline = None
        self._keybert_model = None
        
    @property
    def embedding_model(self):
        """Lazy load embedding model."""
        if self._embedding_model is None:
            logger.info(f"🔄 Loading embedding model: all-MiniLM-L6-v2 on {self.device.upper()}")
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=self.device)
        return self._embedding_model
    
    @property
    def summarization_pipeline(self):
        """Lazy load summarization pipeline."""
        if self._summarization_pipeline is None:
            device_id = 0 if self.device == "cuda" else -1  # GPU device 0 or CPU (-1)
            logger.info(f"🔄 Loading summarization model: sshleifer/distilbart-cnn-12-6 on {self.device.upper()}")
            try:
                self._summarization_pipeline = pipeline(
                    "summarization",
                    model="sshleifer/distilbart-cnn-12-6",
                    device=device_id,
                    model_kwargs={"use_safetensors": True}  # 🔒 SECURITY FIX: Use safetensors
                )
                logger.info("✅ Summarization pipeline loaded successfully with safetensors")
            except Exception as e:
                logger.warning(f"Failed to load with safetensors, trying fallback: {e}")
                # Fallback without safetensors requirement
                self._summarization_pipeline = pipeline(
                    "summarization",
                    model="sshleifer/distilbart-cnn-12-6",
                    device=device_id
                )
        return self._summarization_pipeline
    
    @property
    def classification_pipeline(self):
        """Lazy load zero-shot classification pipeline."""
        if self._classification_pipeline is None:
            device_id = 0 if self.device == "cuda" else -1  # GPU device 0 or CPU (-1)
            logger.info(f"🔄 Loading classification model: facebook/bart-large-mnli on {self.device.upper()}")
            try:
                self._classification_pipeline = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=device_id,
                    model_kwargs={"use_safetensors": True}  # 🔒 SECURITY FIX: Use safetensors
                )
                logger.info("✅ Classification pipeline loaded successfully with safetensors")
            except Exception as e:
                logger.warning(f"Failed to load with safetensors, trying fallback: {e}")
                # Fallback without safetensors requirement
                self._classification_pipeline = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=device_id
                )
        return self._classification_pipeline
    
    @property
    def keybert_model(self):
        """Lazy load KeyBERT model."""
        if self._keybert_model is None:
            try:
                from keybert import KeyBERT
                logger.info("Loading KeyBERT model")
                self._keybert_model = KeyBERT(model=self.embedding_model)
            except ImportError:
                logger.error("KeyBERT not installed. Install with: pip install keybert")
                self._keybert_model = None
        return self._keybert_model
    
    def generate_embeddings(self, articles: List[Dict], text_field: str = 'content') -> List[Dict]:
        """
        Generate embeddings for articles.
        
        Args:
            articles: List of article dictionaries
            text_field: Field to use for generating embeddings
            
        Returns:
            Articles with embeddings added
        """
        logger.info(f"Generating embeddings for {len(articles)} articles")
        
        # Extract texts for embedding
        texts = []
        for article in articles:
            text = article.get(text_field, '') or article.get('title', '')
            if not text.strip():
                text = "No content available"
            texts.append(text)
        
        # Generate embeddings in batches
        try:
            embeddings = self.embedding_model.encode(
                texts,
                batch_size=32,
                show_progress_bar=True,
                normalize_embeddings=True
            )
            
            # Add embeddings to articles
            for article, embedding in zip(articles, embeddings):
                article['embedding'] = embedding.tolist()
                article['embedding_dim'] = len(embedding)
            
            logger.info("Successfully generated embeddings")
            return articles
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Return articles without embeddings
            for article in articles:
                article['embedding'] = None
                article['embedding_error'] = str(e)
            return articles
    
    def summarize_articles(self, articles: List[Dict], content_field: str = 'content') -> List[Dict]:
        """
        Generate summaries for articles using MapReduce strategy for long texts.
        
        Args:
            articles: List of article dictionaries
            content_field: Field containing the content to summarize
            
        Returns:
            Articles with summaries added
        """
        logger.info(f"Generating summaries for {len(articles)} articles")
        
        for i, article in enumerate(articles):
            try:
                content = article.get(content_field, '')
                if not content or len(content.strip()) < 50:
                    article['summary'] = article.get('title', 'No content to summarize')
                    continue
                
                summary = self._summarize_with_mapreduce(content)
                article['summary'] = summary
                
                if i % 10 == 0:
                    logger.info(f"Processed {i+1}/{len(articles)} summaries")
                
            except Exception as e:
                logger.error(f"Error summarizing article {i}: {e}")
                article['summary'] = article.get('title', 'Summary generation failed')
                article['summary_error'] = str(e)
        
        logger.info("Completed summary generation")
        return articles
    
    def _summarize_with_mapreduce(self, text: str, max_chunk_length: int = 1000) -> str:
        """
        Summarize long text using MapReduce strategy.
        
        Args:
            text: Text to summarize
            max_chunk_length: Maximum characters per chunk
            
        Returns:
            Generated summary
        """
        # If text is short enough, summarize directly
        if len(text) <= max_chunk_length:
            return self._generate_summary(text)
        
        # Split into chunks
        chunks = []
        words = text.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) > max_chunk_length and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
            else:
                current_chunk.append(word)
                current_length += len(word) + 1
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        # Summarize each chunk
        chunk_summaries = []
        for chunk in chunks:
            summary = self._generate_summary(chunk)
            if summary:
                chunk_summaries.append(summary)
        
        # Combine and summarize again if needed
        combined = ' '.join(chunk_summaries)
        if len(combined) > max_chunk_length:
            return self._generate_summary(combined)
        else:
            return combined
    
    def _generate_summary(self, text: str) -> str:
        """Generate summary for a single text."""
        try:
            # Ensure minimum length for summarization
            if len(text) < 50:
                return text
            
            result = self.summarization_pipeline(
                text,
                max_length=150,
                min_length=30,
                do_sample=False
            )
            return result[0]['summary_text']
            
        except Exception as e:
            logger.warning(f"Summarization failed: {e}")
            # Fallback to first sentence or truncated text
            sentences = text.split('.')
            return sentences[0][:150] + "..." if sentences else text[:150] + "..."
    
    def categorize_articles(self, articles: List[Dict], 
                          candidate_labels: List[str] = None) -> List[Dict]:
        """
        Categorize articles using zero-shot classification.
        
        Args:
            articles: List of article dictionaries
            candidate_labels: List of category labels
            
        Returns:
            Articles with categories added
        """
        if candidate_labels is None:
            candidate_labels = [
                "Politics", "Technology", "Business", "Health", "Sports", 
                "Entertainment", "Science", "World News", "Education", "Environment"
            ]
        
        logger.info(f"Categorizing {len(articles)} articles into {len(candidate_labels)} categories")
        
        for i, article in enumerate(articles):
            try:
                # Use title + description for classification
                text = f"{article.get('title', '')} {article.get('description', '')}"
                if not text.strip():
                    text = article.get('content', '')[:200]  # Use first 200 chars of content
                
                if not text.strip():
                    article['category'] = "Uncategorized"
                    article['category_confidence'] = 0.0
                    continue
                
                result = self.classification_pipeline(text, candidate_labels)
                
                article['category'] = result['labels'][0]
                article['category_confidence'] = result['scores'][0]
                article['all_categories'] = dict(zip(result['labels'], result['scores']))
                
                if i % 20 == 0:
                    logger.info(f"Categorized {i+1}/{len(articles)} articles")
                
            except Exception as e:
                logger.error(f"Error categorizing article {i}: {e}")
                article['category'] = "Uncategorized"
                article['category_confidence'] = 0.0
                article['category_error'] = str(e)
        
        logger.info("Completed article categorization")
        return articles
    
    def extract_keywords(self, articles: List[Dict], 
                        content_field: str = 'content', 
                        num_keywords: int = 5) -> List[Dict]:
        """
        Extract keywords from articles using KeyBERT.
        
        Args:
            articles: List of article dictionaries
            content_field: Field to extract keywords from
            num_keywords: Number of keywords to extract
            
        Returns:
            Articles with keywords added
        """
        if self.keybert_model is None:
            logger.warning("KeyBERT model not available, skipping keyword extraction")
            for article in articles:
                article['keywords'] = []
            return articles
        
        logger.info(f"Extracting keywords for {len(articles)} articles")
        
        for i, article in enumerate(articles):
            try:
                text = article.get(content_field, '') or article.get('title', '')
                
                if not text or len(text.strip()) < 20:
                    article['keywords'] = []
                    continue
                
                # Extract keywords
                keywords = self.keybert_model.extract_keywords(
                    text,
                    keyphrase_ngram_range=(1, 2),
                    stop_words='english',
                    top_k=num_keywords,
                    use_mmr=True,
                    diversity=0.5
                )
                
                # Extract just the keyword strings and scores
                article['keywords'] = [kw[0] for kw in keywords]
                article['keyword_scores'] = [kw[1] for kw in keywords]
                
                if i % 25 == 0:
                    logger.info(f"Extracted keywords for {i+1}/{len(articles)} articles")
                
            except Exception as e:
                logger.error(f"Error extracting keywords for article {i}: {e}")
                article['keywords'] = []
                article['keyword_error'] = str(e)
        
        logger.info("Completed keyword extraction")
        return articles
    
    def process_articles_full_pipeline(self, articles: List[Dict]) -> List[Dict]:
        """
        Run the complete NLP pipeline on articles.
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            Fully processed articles
        """
        logger.info(f"Starting full NLP pipeline for {len(articles)} articles")
        
        # 1. Generate embeddings (do this first as it's used by other processes)
        articles = self.generate_embeddings(articles)
        
        # 2. Categorize articles
        articles = self.categorize_articles(articles)
        
        # 3. Extract keywords
        articles = self.extract_keywords(articles)
        
        # 4. Generate summaries
        articles = self.summarize_articles(articles)
        
        logger.info("Completed full NLP pipeline")
        return articles