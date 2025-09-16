"""Zero-shot classification model for article categorization."""
import logging
from typing import List, Dict, Optional, Tuple
from transformers import pipeline
import torch

logger = logging.getLogger(__name__)

class CategoryModel:
    """Manages zero-shot classification for article categorization."""
    
    def __init__(self, model_name: str = "facebook/bart-large-mnli"):
        self.model_name = model_name
        
        # ========================================
        # 🚀 GPU ACCELERATION SETUP  
        # ========================================
        # Auto-detect GPU for categorization model
        # BART-large is a heavy model - GPU makes a huge difference!
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._pipeline = None
        
        # Default categories
        self.default_categories = [
            "Politics",
            "Technology", 
            "Business",
            "Health",
            "Sports",
            "Entertainment",
            "Science",
            "World News",
            "Education",
            "Environment",
            "Crime",
            "Travel",
            "Food",
            "Fashion",
            "Real Estate",
            "Automotive",
            "Finance",
            "Military",
            "Weather"
        ]
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🎯 GPU DETECTED: Using {gpu_name} ({gpu_memory:.1f}GB) for categorization")
            logger.info(f"💡 BART-large will run much faster on GPU!")
        else:
            logger.info(f"💻 Using CPU for categorization (BART-large will be slow)")
        
        logger.info(f"CategoryModel initialized with device: {self.device}")
    
    @property
    def pipeline(self):
        """Lazy load the classification pipeline."""
        if self._pipeline is None:
            logger.info(f"Loading classification model: {self.model_name}")
            try:
                self._pipeline = pipeline(
                    "zero-shot-classification",
                    model=self.model_name,
                    device=0 if self.device == "cuda" else -1,
                    framework="pt"
                )
                logger.info("Classification model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load classification model: {e}")
                raise
        return self._pipeline
    
    def categorize_single(self, 
                         text: str, 
                         candidate_labels: Optional[List[str]] = None,
                         hypothesis_template: Optional[str] = None) -> Dict:
        """
        Categorize a single text.
        
        Args:
            text: Text to categorize
            candidate_labels: List of possible categories
            hypothesis_template: Template for hypothesis generation
            
        Returns:
            Dictionary with category, confidence, and all scores
        """
        if not text.strip():
            return {
                'category': 'Uncategorized',
                'confidence': 0.0,
                'all_categories': {}
            }
        
        labels = candidate_labels or self.default_categories
        
        try:
            # Clean text for better classification
            cleaned_text = self._prepare_text_for_classification(text)
            
            result = self.pipeline(
                cleaned_text,
                labels,
                hypothesis_template=hypothesis_template or "This text is about {}."
            )
            
            # Create category mapping
            category_scores = dict(zip(result['labels'], result['scores']))
            
            return {
                'category': result['labels'][0],
                'confidence': result['scores'][0],
                'all_categories': category_scores
            }
            
        except Exception as e:
            logger.error(f"Error in categorization: {e}")
            return {
                'category': 'Uncategorized',
                'confidence': 0.0,
                'all_categories': {},
                'error': str(e)
            }
    
    def categorize_batch(self, 
                        texts: List[str], 
                        candidate_labels: Optional[List[str]] = None) -> List[Dict]:
        """
        Categorize a batch of texts.
        
        Args:
            texts: List of texts to categorize
            candidate_labels: List of possible categories
            
        Returns:
            List of categorization results
        """
        logger.info(f"Categorizing batch of {len(texts)} texts")
        
        results = []
        labels = candidate_labels or self.default_categories
        
        for i, text in enumerate(texts):
            try:
                result = self.categorize_single(text, labels)
                results.append(result)
                
                if i % 20 == 0 and i > 0:
                    logger.info(f"Categorized {i}/{len(texts)} texts")
                    
            except Exception as e:
                logger.error(f"Error categorizing text {i}: {e}")
                results.append({
                    'category': 'Uncategorized',
                    'confidence': 0.0,
                    'all_categories': {},
                    'error': str(e)
                })
        
        logger.info("Completed batch categorization")
        return results
    
    def categorize_articles(self, articles: List[Dict]) -> List[Dict]:
        """
        Categorize articles using title and description.
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            Articles with category information added
        """
        logger.info(f"Categorizing {len(articles)} articles")
        
        for i, article in enumerate(articles):
            try:
                # Combine title and description for classification
                text_parts = []
                
                if article.get('title'):
                    text_parts.append(article['title'])
                
                if article.get('description'):
                    text_parts.append(article['description'])
                
                # If no title/description, use first part of content
                if not text_parts and article.get('content'):
                    content_preview = article['content'][:300]  # First 300 chars
                    text_parts.append(content_preview)
                
                if not text_parts:
                    # No text to classify
                    article['category'] = 'Uncategorized'
                    article['category_confidence'] = 0.0
                    article['all_categories'] = {}
                    continue
                
                classification_text = ". ".join(text_parts)
                result = self.categorize_single(classification_text)
                
                # Add results to article
                article['category'] = result['category']
                article['category_confidence'] = result['confidence']
                article['all_categories'] = result['all_categories']
                
                if result.get('error'):
                    article['category_error'] = result['error']
                
                if i % 20 == 0 and i > 0:
                    logger.info(f"Categorized {i}/{len(articles)} articles")
                    
            except Exception as e:
                logger.error(f"Error categorizing article {i}: {e}")
                article['category'] = 'Uncategorized'
                article['category_confidence'] = 0.0
                article['all_categories'] = {}
                article['category_error'] = str(e)
        
        logger.info("Completed article categorization")
        return articles
    
    def _prepare_text_for_classification(self, text: str) -> str:
        """Prepare text for better classification results."""
        import re
        
        # Remove URLs
        text = re.sub(r'http[s]?://\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Clean extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Truncate if too long (BART has limits)
        max_chars = 500  # Conservative limit
        if len(text) > max_chars:
            # Try to cut at sentence boundary
            sentences = text[:max_chars].split('. ')
            if len(sentences) > 1:
                text = '. '.join(sentences[:-1]) + '.'
            else:
                text = text[:max_chars]
        
        return text.strip()
    
    def get_category_distribution(self, articles: List[Dict]) -> Dict[str, int]:
        """
        Get distribution of categories in articles.
        
        Args:
            articles: List of categorized articles
            
        Returns:
            Dictionary mapping category names to counts
        """
        distribution = {}
        
        for article in articles:
            category = article.get('category', 'Uncategorized')
            distribution[category] = distribution.get(category, 0) + 1
        
        return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))
    
    def suggest_categories(self, articles: List[Dict], min_confidence: float = 0.7) -> List[str]:
        """
        Suggest new categories based on low-confidence classifications.
        
        Args:
            articles: List of categorized articles
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of suggested new categories
        """
        low_confidence_texts = []
        
        for article in articles:
            confidence = article.get('category_confidence', 0)
            if confidence < min_confidence:
                # Extract key phrases from title/description
                text = f"{article.get('title', '')} {article.get('description', '')}"
                low_confidence_texts.append(text)
        
        # This is a simplified approach - in practice, you might want to use
        # more sophisticated methods like topic modeling or keyword extraction
        suggestions = []
        
        # Extract common words from low-confidence articles
        from collections import Counter
        import re
        
        words = []
        for text in low_confidence_texts:
            # Extract meaningful words
            text_words = re.findall(r'\b[A-Za-z]{4,}\b', text.lower())
            words.extend(text_words)
        
        # Find most common words that aren't in existing categories
        existing_categories_lower = [cat.lower() for cat in self.default_categories]
        word_counts = Counter(words)
        
        for word, count in word_counts.most_common(10):
            if count >= 3 and word not in existing_categories_lower:
                suggestions.append(word.title())
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def update_categories(self, new_categories: List[str]):
        """
        Update the default categories list.
        
        Args:
            new_categories: List of new categories to add
        """
        for category in new_categories:
            if category not in self.default_categories:
                self.default_categories.append(category)
        
        logger.info(f"Updated categories. Now have {len(self.default_categories)} categories")
    
    def get_model_info(self) -> dict:
        """Get information about the model."""
        return {
            'model_name': self.model_name,
            'device': self.device,
            'num_categories': len(self.default_categories),
            'categories': self.default_categories,
            'model_loaded': self._pipeline is not None
        }