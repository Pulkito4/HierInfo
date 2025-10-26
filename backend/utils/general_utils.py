from __future__ import annotations

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
