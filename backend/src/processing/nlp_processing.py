"""
NLP processing functions - categorization, summarization, keyword extraction.
"""

import logging
from typing import List, Dict, Tuple
import re
from collections import Counter

logger = logging.getLogger(__name__)

# Category keywords for rule-based classification
CATEGORY_KEYWORDS = {
    "technology": [
        "ai",
        "artificial intelligence",
        "machine learning",
        "tech",
        "software",
        "computer",
        "digital",
        "app",
        "algorithm",
        "data",
        "cloud",
        "cyber",
        "startup",
        "innovation",
        "programming",
        "code",
        "developer",
        "platform",
        "iphone",
        "android",
        "apple",
        "google",
        "microsoft",
        "meta",
        "tesla",
    ],
    "business": [
        "business",
        "company",
        "corporate",
        "market",
        "stock",
        "investment",
        "economy",
        "financial",
        "revenue",
        "profit",
        "enterprise",
        "startup",
        "funding",
        "venture",
        "capital",
        "merger",
        "acquisition",
        "ceo",
        "cfo",
    ],
    "health": [
        "health",
        "medical",
        "medicine",
        "doctor",
        "hospital",
        "treatment",
        "disease",
        "covid",
        "vaccine",
        "virus",
        "patient",
        "healthcare",
        "pharmaceutical",
        "clinical",
        "therapy",
        "diagnosis",
        "surgery",
    ],
    "science": [
        "science",
        "research",
        "study",
        "scientist",
        "discovery",
        "experiment",
        "laboratory",
        "nature",
        "climate",
        "environment",
        "space",
        "nasa",
        "physics",
        "chemistry",
        "biology",
        "genetics",
        "evolution",
    ],
    "politics": [
        "politics",
        "government",
        "president",
        "election",
        "vote",
        "congress",
        "senate",
        "democrat",
        "republican",
        "policy",
        "law",
        "legislation",
        "supreme court",
        "biden",
        "trump",
        "washington",
        "white house",
    ],
}


def categorize_article(article: Dict) -> Tuple[str, float]:
    """
    Categorize an article using keyword-based classification.

    Args:
        article: Article dictionary with title and content

    Returns:
        Tuple of (category, confidence_score)
    """
    title = article.get("title", "").lower()
    content = article.get("content", "").lower()
    combined_text = f"{title} {content}"

    if not combined_text.strip():
        return "general", 0.5

    category_scores = {}

    # Score each category based on keyword matches
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            # Count keyword occurrences (case insensitive)
            count = combined_text.count(keyword.lower())
            if count > 0:
                # Weight by keyword length and frequency
                score += count * len(keyword.split())

        # Normalize by text length
        if len(combined_text) > 0:
            category_scores[category] = score / len(combined_text) * 1000
        else:
            category_scores[category] = 0

    # Find best category
    if category_scores and max(category_scores.values()) > 0:
        best_category = max(category_scores, key=category_scores.get)
        max_score = category_scores[best_category]

        # Calculate confidence (normalize to 0-1 range)
        confidence = min(max_score, 1.0)

        # Minimum confidence threshold
        if confidence > 0.1:
            return best_category, confidence

    return "general", 0.5


def categorize_articles(articles: List[Dict]) -> List[Dict]:
    """
    Add categories to a list of articles.

    Args:
        articles: List of article dictionaries

    Returns:
        Articles with added category and confidence fields
    """
    categorized_articles = []

    for article in articles:
        article_copy = article.copy()
        category, confidence = categorize_article(article)

        article_copy["category"] = category
        article_copy["category_confidence"] = confidence

        categorized_articles.append(article_copy)

    logger.info(f"Categorized {len(categorized_articles)} articles")
    return categorized_articles


def extract_keywords(text: str, max_keywords: int = 5) -> List[str]:
    """
    Extract keywords from text using simple frequency analysis.

    Args:
        text: Input text
        max_keywords: Maximum number of keywords to extract

    Returns:
        List of extracted keywords
    """
    if not text:
        return []

    # Clean text
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)

    # Split into words
    words = text.split()

    # Filter out common stop words and short words
    stop_words = {
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "from",
        "up",
        "about",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "between",
        "among",
        "this",
        "that",
        "these",
        "those",
        "i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "ourselves",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "he",
        "him",
        "his",
        "himself",
        "she",
        "her",
        "hers",
        "herself",
        "it",
        "its",
        "itself",
        "they",
        "them",
        "their",
        "theirs",
        "themselves",
        "what",
        "which",
        "who",
        "whom",
        "whose",
        "this",
        "that",
        "these",
        "those",
        "am",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "having",
        "do",
        "does",
        "did",
        "doing",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "must",
        "can",
        "said",
        "say",
        "says",
    }

    filtered_words = [
        word for word in words if len(word) > 2 and word not in stop_words
    ]

    # Count word frequency
    word_counts = Counter(filtered_words)

    # Get most common words
    keywords = [word for word, count in word_counts.most_common(max_keywords)]

    return keywords


def add_keywords_to_articles(articles: List[Dict]) -> List[Dict]:
    """
    Add keywords to articles based on their content.

    Args:
        articles: List of article dictionaries

    Returns:
        Articles with added keywords
    """
    articles_with_keywords = []

    for article in articles:
        article_copy = article.copy()

        # Combine title and content for keyword extraction
        title = article.get("title", "")
        content = article.get("content", "")
        combined_text = f"{title}. {content}"

        keywords = extract_keywords(combined_text, max_keywords=5)
        article_copy["keywords"] = keywords

        articles_with_keywords.append(article_copy)

    logger.info(f"Added keywords to {len(articles_with_keywords)} articles")
    return articles_with_keywords


def create_summary(text: str, max_sentences: int = 3) -> str:
    """
    Create a simple extractive summary by selecting key sentences.

    Args:
        text: Input text to summarize
        max_sentences: Maximum number of sentences in summary

    Returns:
        Generated summary
    """
    if not text or len(text) < 100:
        return text

    # Split into sentences
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

    if len(sentences) <= max_sentences:
        return ". ".join(sentences) + "."

    # Score sentences based on position and word frequency
    word_freq = Counter()
    for sentence in sentences:
        words = re.findall(r"\w+", sentence.lower())
        word_freq.update(words)

    sentence_scores = []
    for i, sentence in enumerate(sentences):
        words = re.findall(r"\w+", sentence.lower())

        # Score based on word frequency
        score = sum(word_freq[word] for word in words)

        # Boost first and last sentences slightly
        if i == 0 or i == len(sentences) - 1:
            score *= 1.2

        sentence_scores.append((score, sentence))

    # Select top sentences
    sentence_scores.sort(reverse=True)
    top_sentences = [sent for score, sent in sentence_scores[:max_sentences]]

    # Maintain original order
    summary_sentences = []
    for sentence in sentences:
        if sentence in top_sentences:
            summary_sentences.append(sentence)

    return ". ".join(summary_sentences[:max_sentences]) + "."


def add_summaries_to_articles(articles: List[Dict]) -> List[Dict]:
    """
    Add summaries to articles.

    Args:
        articles: List of article dictionaries

    Returns:
        Articles with added summaries
    """
    articles_with_summaries = []

    for article in articles:
        article_copy = article.copy()

        content = article.get("content", "")
        if content and len(content) > 200:
            summary = create_summary(content, max_sentences=3)
        else:
            # Fall back to description or truncated content
            summary = article.get(
                "description", content[:200] + "..." if content else ""
            )

        article_copy["summary"] = summary
        articles_with_summaries.append(article_copy)

    logger.info(f"Added summaries to {len(articles_with_summaries)} articles")
    return articles_with_summaries


def calculate_trending_score(article: Dict) -> float:
    """
    Calculate a trending score for an article (0-1).

    Args:
        article: Article dictionary

    Returns:
        Trending score
    """
    score = 0.5  # Base score

    # Content quality indicators
    content = article.get("content", "")
    if len(content) > 1000:
        score += 0.1

    title = article.get("title", "")
    if any(
        word in title.lower() for word in ["breaking", "urgent", "exclusive", "update"]
    ):
        score += 0.2

    # Category confidence
    category_confidence = article.get("category_confidence", 0.5)
    score += (category_confidence - 0.5) * 0.2

    # Keyword relevance
    keywords = article.get("keywords", [])
    if len(keywords) >= 3:
        score += 0.1

    return min(max(score, 0.0), 1.0)  # Clamp to [0,1]


def add_trending_scores_to_articles(articles: List[Dict]) -> List[Dict]:
    """
    Add trending scores to articles.

    Args:
        articles: List of article dictionaries

    Returns:
        Articles with added trending scores
    """
    articles_with_scores = []

    for article in articles:
        article_copy = article.copy()
        trending_score = calculate_trending_score(article)
        article_copy["trending_score"] = trending_score
        articles_with_scores.append(article_copy)

    logger.info(f"Added trending scores to {len(articles_with_scores)} articles")
    return articles_with_scores
