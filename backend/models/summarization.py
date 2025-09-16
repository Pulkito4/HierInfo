"""Summarization model for article content."""
import logging
from typing import List, Dict, Optional, Union
from transformers import pipeline, AutoTokenizer
import torch
import math
import re

logger = logging.getLogger(__name__)

class SummarizationModel:
    """Manages summarization using DistilBART with MapReduce strategy."""
    
    def __init__(self, model_name: str = "sshleifer/distilbart-cnn-12-6"):
        self.model_name = model_name
        
        # ========================================
        # 🚀 GPU ACCELERATION SETUP
        # ========================================
        # Auto-detect GPU for summarization model
        # This is crucial for speed - summarization is compute-intensive
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._pipeline = None
        self._tokenizer = None
        
        # Model parameters
        self.max_input_length = 1024  # DistilBART max input
        self.max_output_length = 142  # DistilBART max output
        self.min_output_length = 30
        self.chunk_overlap = 50  # Overlap between chunks
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"🎯 GPU DETECTED: Using {gpu_name} for summarization (much faster!)")
        else:
            logger.info(f"💻 Using CPU for summarization (will be slower)")
        
        logger.info(f"SummarizationModel initialized with device: {self.device}")
    
    @property
    def pipeline(self):
        """Lazy load the summarization pipeline."""
        if self._pipeline is None:
            logger.info(f"Loading summarization model: {self.model_name}")
            try:
                self._pipeline = pipeline(
                    "summarization",
                    model=self.model_name,
                    device=0 if self.device == "cuda" else -1,
                    framework="pt"
                )
                logger.info("Summarization model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load summarization model: {e}")
                raise
        return self._pipeline
    
    @property
    def tokenizer(self):
        """Lazy load the tokenizer."""
        if self._tokenizer is None:
            try:
                from transformers import AutoTokenizer
                self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load tokenizer: {e}")
                raise
        return self._tokenizer
    
    def summarize(self, text: str, max_length: Optional[int] = None, min_length: Optional[int] = None) -> str:
        """
        Summarize text using MapReduce strategy for long texts.
        
        Args:
            text: Input text to summarize
            max_length: Maximum length of summary
            min_length: Minimum length of summary
            
        Returns:
            Generated summary
        """
        if not text or len(text.strip()) < 50:
            return text.strip()
        
        # Clean the text
        cleaned_text = self._clean_text(text)
        
        # Check if text needs chunking
        if self._needs_chunking(cleaned_text):
            return self._summarize_with_mapreduce(cleaned_text, max_length, min_length)
        else:
            return self._summarize_direct(cleaned_text, max_length, min_length)
    
    def _needs_chunking(self, text: str) -> bool:
        """Check if text exceeds model limits and needs chunking."""
        try:
            tokens = self.tokenizer.encode(text, add_special_tokens=True)
            return len(tokens) > self.max_input_length
        except Exception:
            # Fallback to character count heuristic
            return len(text) > self.max_input_length * 4  # Rough estimate: 4 chars per token
    
    def _summarize_direct(self, text: str, max_length: Optional[int] = None, min_length: Optional[int] = None) -> str:
        """Summarize text directly without chunking."""
        try:
            max_len = min(max_length or self.max_output_length, self.max_output_length)
            min_len = max(min_length or self.min_output_length, self.min_output_length)
            min_len = min(min_len, max_len - 10)  # Ensure min < max
            
            result = self.pipeline(
                text,
                max_length=max_len,
                min_length=min_len,
                do_sample=False,
                truncation=True
            )
            
            return result[0]['summary_text'].strip()
            
        except Exception as e:
            logger.error(f"Direct summarization failed: {e}")
            # Fallback to first sentences
            return self._extractive_fallback(text, max_length)
    
    def _summarize_with_mapreduce(self, text: str, max_length: Optional[int] = None, min_length: Optional[int] = None) -> str:
        """
        Summarize long text using MapReduce strategy.
        
        Map: Split text into chunks and summarize each
        Reduce: Combine summaries and summarize again
        """
        logger.debug("Using MapReduce summarization for long text")
        
        try:
            # Step 1: Split text into manageable chunks
            chunks = self._split_into_chunks(text)
            logger.debug(f"Split text into {len(chunks)} chunks")
            
            # Step 2: Summarize each chunk (Map phase)
            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                try:
                    summary = self._summarize_direct(chunk)
                    if summary:
                        chunk_summaries.append(summary)
                except Exception as e:
                    logger.warning(f"Failed to summarize chunk {i}: {e}")
                    continue
            
            if not chunk_summaries:
                logger.error("No chunk summaries generated")
                return self._extractive_fallback(text, max_length)
            
            # Step 3: Combine summaries (Reduce phase)
            combined_summary = " ".join(chunk_summaries)
            
            # Step 4: Final summarization if combined is still too long
            if self._needs_chunking(combined_summary):
                logger.debug("Combined summary still too long, summarizing again")
                return self._summarize_direct(combined_summary, max_length, min_length)
            else:
                return combined_summary
                
        except Exception as e:
            logger.error(f"MapReduce summarization failed: {e}")
            return self._extractive_fallback(text, max_length)
    
    def _split_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks that fit model limits."""
        # Split by sentences first
        sentences = self._split_sentences(text)
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_tokens = len(sentence.split())  # Rough token estimate
            
            # If adding this sentence would exceed limit, save current chunk
            if current_length + sentence_tokens > self.max_input_length // 4 and current_chunk:  # 4 chars per token estimate
                chunk_text = " ".join(current_chunk)
                chunks.append(chunk_text)
                
                # Start new chunk with overlap
                overlap_sentences = current_chunk[-2:] if len(current_chunk) >= 2 else current_chunk
                current_chunk = overlap_sentences + [sentence]
                current_length = sum(len(s.split()) for s in current_chunk)
            else:
                current_chunk.append(sentence)
                current_length += sentence_tokens
        
        # Add the last chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting - can be improved with NLTK/spaCy
        sentence_endings = r'[.!?]+\s+'
        sentences = re.split(sentence_endings, text)
        
        # Clean and filter sentences
        cleaned_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 10:  # Filter very short sentences
                cleaned_sentences.append(sentence)
        
        return cleaned_sentences
    
    def _clean_text(self, text: str) -> str:
        """Clean text before summarization."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove excessive punctuation
        text = re.sub(r'[.]{3,}', '...', text)
        
        # Remove common article footers/headers
        patterns_to_remove = [
            r'Subscribe to.*',
            r'Follow us on.*',
            r'Advertisement.*',
            r'Related Articles.*',
            r'More from.*',
            r'Continue reading.*'
        ]
        
        for pattern in patterns_to_remove:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def _extractive_fallback(self, text: str, max_length: Optional[int] = None) -> str:
        """Fallback extractive summarization when abstractive fails."""
        sentences = self._split_sentences(text)
        
        if not sentences:
            return text[:200] + "..." if len(text) > 200 else text
        
        # Take first few sentences as summary
        max_chars = (max_length * 5) if max_length else 500  # Rough estimate
        summary = ""
        
        for sentence in sentences:
            if len(summary) + len(sentence) > max_chars:
                break
            summary += sentence + ". "
        
        return summary.strip()
    
    def summarize_batch(self, texts: List[str], max_length: Optional[int] = None) -> List[str]:
        """
        Summarize a batch of texts.
        
        Args:
            texts: List of texts to summarize
            max_length: Maximum length for each summary
            
        Returns:
            List of summaries
        """
        logger.info(f"Summarizing batch of {len(texts)} texts")
        summaries = []
        
        for i, text in enumerate(texts):
            try:
                summary = self.summarize(text, max_length)
                summaries.append(summary)
                
                if i % 10 == 0 and i > 0:
                    logger.info(f"Processed {i}/{len(texts)} summaries")
                    
            except Exception as e:
                logger.error(f"Error summarizing text {i}: {e}")
                summaries.append(self._extractive_fallback(text, max_length))
        
        logger.info(f"Completed batch summarization")
        return summaries
    
    def get_model_info(self) -> dict:
        """Get information about the model."""
        return {
            'model_name': self.model_name,
            'device': self.device,
            'max_input_length': self.max_input_length,
            'max_output_length': self.max_output_length,
            'model_loaded': self._pipeline is not None
        }