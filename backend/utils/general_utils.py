from __future__ import annotations
from urllib.parse import urlparse, urlunparse

from typing import Optional, Tuple, TYPE_CHECKING

from sentence_transformers.util import cos_sim

if TYPE_CHECKING:  # pragma: no cover - avoids heavy imports unless needed
    from sentence_transformers import SentenceTransformer


def _get_embedding_model() -> "SentenceTransformer":
    from src.processing.embedder import model as embedding_model  # type: ignore

    return embedding_model


def check_title_content_alignment(
    title: Optional[str],
    content: Optional[str],
    *,
    threshold: float = 0.25,
    min_content_length: int = 50,
    max_content_chars: int = 512,
) -> Tuple[bool, Optional[float], Optional[str]]:
    """Evaluate whether a news title and body are semantically aligned."""
    if not isinstance(content, str) or not content.strip():
        return False, None, "missing_content"

    trimmed_content = content.strip()
    if len(trimmed_content) < min_content_length:
        return True, None, "content_too_short"

    if not isinstance(title, str) or not title.strip():
        return True, None, "missing_title"

    embedding_model = _get_embedding_model()
    title_embedding = embedding_model.encode(title, convert_to_tensor=True)
    content_embedding = embedding_model.encode(
        trimmed_content[:max_content_chars], convert_to_tensor=True
    )
    similarity = cos_sim(title_embedding, content_embedding).item()

    if similarity < threshold:
        return False, similarity, "low_similarity"

    return True, similarity, None


def clean_image_url(raw_url: Optional[str]) -> Optional[str]:
    """
    Strips all query parameters and fragments from a URL.
    e.g., 'image.jpg?width=100&crop=true' -> 'image.jpg'
    """
    if not raw_url:
        return None
    try:
        parsed_url = urlparse(raw_url)
        # Reconstruct the URL with only the essential parts
        clean_url = urlunparse((
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            '',  # No params
            '',  # No query
            ''   # No fragment
        ))
        return clean_url
    except Exception:
        # Fallback to the raw URL if parsing fails for any reason
        return raw_url
