"""Common helper functions for the pipeline."""

import hashlib
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
from urllib.parse import urlparse
import time


def generate_hash(text: str) -> str:
    """Generate MD5 hash of text."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def clean_url(url: str) -> str:
    """Clean and normalize URL."""
    if not url:
        return ""

    # Remove tracking parameters
    tracking_params = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "ref",
        "source",
    ]

    try:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)

        # Remove tracking parameters
        for param in tracking_params:
            query_params.pop(param, None)

        # Rebuild URL
        clean_query = urlencode(query_params, doseq=True)
        clean_parsed = parsed._replace(query=clean_query)
        return urlunparse(clean_parsed)

    except Exception:
        return url


def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        return urlparse(url).netloc.lower()
    except Exception:
        return ""


def is_valid_url(url: str) -> bool:
    """Check if URL is valid."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def clean_text(text: str) -> str:
    """Clean text content."""
    if not text:
        return ""

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove control characters
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)

    # Remove HTML entities (basic)
    html_entities = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&#39;": "'",
        "&nbsp;": " ",
    }

    for entity, replacement in html_entities.items():
        text = text.replace(entity, replacement)

    return text.strip()


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to maximum length."""
    if len(text) <= max_length:
        return text

    return text[: max_length - len(suffix)] + suffix


def parse_flexible_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse date string with multiple formats."""
    if not date_str:
        return None

    formats = [
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%d %b %Y %H:%M:%S",
        "%b %d, %Y",
        "%B %d, %Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    # Try parsing with dateutil if available
    try:
        from dateutil import parser

        return parser.parse(date_str)
    except (ImportError, ValueError):
        pass

    return None


def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes."""
    if not text:
        return 0

    word_count = len(text.split())
    return max(1, round(word_count / words_per_minute))


def extract_keywords_simple(text: str, max_keywords: int = 10) -> List[str]:
    """Simple keyword extraction (fallback when KeyBERT is not available)."""
    if not text:
        return []

    # Common stop words
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
        "as",
        "is",
        "was",
        "are",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "can",
        "this",
        "that",
        "these",
        "those",
        "i",
        "you",
        "he",
        "she",
        "it",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "my",
        "your",
        "his",
        "its",
        "our",
        "their",
    }

    # Extract words
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())

    # Filter stop words and count frequency
    from collections import Counter

    word_freq = Counter([word for word in words if word not in stop_words])

    return [word for word, _ in word_freq.most_common(max_keywords)]


def batch_process(
    items: List[Any], batch_size: int, process_func, **kwargs
) -> List[Any]:
    """Process items in batches."""
    results = []

    for i in range(0, len(items), batch_size):
        batch = items[i : i + batch_size]
        batch_results = process_func(batch, **kwargs)
        results.extend(batch_results)

        # Small delay between batches to be nice to resources
        if i + batch_size < len(items):
            time.sleep(0.1)

    return results


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe filesystem use."""
    # Remove/replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        max_name_len = 255 - len(ext) - 1 if ext else 255
        filename = name[:max_name_len] + ("." + ext if ext else "")

    return filename or "unnamed"


def retry_on_exception(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying functions on exception."""

    def decorator(func):
        def wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay

            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        raise e

                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper

    return decorator


def format_bytes(bytes_count: int) -> str:
    """Format bytes into human readable string."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_count < 1024.0:
            return f"{bytes_count:.1f} {unit}"
        bytes_count /= 1024.0
    return f"{bytes_count:.1f} PB"


def get_memory_usage() -> Dict[str, str]:
    """Get current memory usage information."""
    try:
        import psutil

        process = psutil.Process()
        memory_info = process.memory_info()

        return {
            "rss": format_bytes(memory_info.rss),
            "vms": format_bytes(memory_info.vms),
            "percent": f"{process.memory_percent():.1f}%",
        }
    except ImportError:
        return {"error": "psutil not available"}


def safe_json_dumps(obj: Any, **kwargs) -> str:
    """Safely serialize object to JSON with fallback for non-serializable objects."""

    def json_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, "__dict__"):
            return obj.__dict__
        else:
            return str(obj)

    try:
        return json.dumps(obj, default=json_serializer, **kwargs)
    except Exception:
        return json.dumps({"error": "Serialization failed", "type": str(type(obj))})


def validate_article_data(article: Dict) -> List[str]:
    """Validate article data and return list of issues."""
    issues = []

    # Required fields
    required_fields = ["title", "url"]
    for field in required_fields:
        if not article.get(field):
            issues.append(f"Missing required field: {field}")

    # URL validation
    if article.get("url") and not is_valid_url(article["url"]):
        issues.append("Invalid URL format")

    # Content length check
    content = article.get("content") or article.get("scraped_content", "")
    if content and len(content) < 50:
        issues.append("Content too short")

    # Title length check
    title = article.get("title", "")
    if len(title) > 500:
        issues.append("Title too long")

    return issues
