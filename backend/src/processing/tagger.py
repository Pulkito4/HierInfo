import pandas as pd
from tqdm import tqdm

from src import constants as C
from utils import get_logger

logger = get_logger(__name__)

# Import the classifier pipeline from categorizer.py (loaded once per process)
try:
    from .categorizer import classifier_pipeline  # type: ignore
except ImportError:  # pragma: no cover - graceful fallback during edge imports
    logger.warning(
        "❌ Could not import classifier_pipeline during module import. Will retry lazily."
    )
    classifier_pipeline = None


def generate_topic_tags(df: pd.DataFrame) -> pd.DataFrame:
    """Assign hierarchical topic tags for the ``keywords`` column."""
    global classifier_pipeline

    if classifier_pipeline is None:
        try:
            from .categorizer import (
                classifier_pipeline as loaded_pipeline,
            )  # local import to avoid cycles
        except ImportError:
            logger.warning(
                "❌ Could not import classifier_pipeline. Skipping topic tag generation."
            )
            df["keywords"] = [[] for _ in range(len(df))]
            return df
        classifier_pipeline = loaded_pipeline
        logger.info("⚙️ Re-initialized classifier pipeline in tagger module.")

    if df.empty or "summary" not in df.columns:
        logger.warning(
            "DataFrame is empty or missing 'summary'. Skipping topic tag generation."
        )
        return df

    if (
        "categories" not in df.columns
        or df["categories"].apply(lambda x: not isinstance(x, list)).any()
    ):
        logger.error(
            "❌ 'categories' column missing or malformed. Run generate_categories before generate_topic_tags."
        )
        df["keywords"] = [[] for _ in range(len(df))]
        return df

    logger.info(
        "🚀 Starting hierarchical topic tag generation for %d articles...", len(df)
    )
    tqdm.pandas(desc="Generating Topic Tags")

    def safe_tag(row: pd.Series) -> list[str]:
        try:
            summary = row.get("summary", "")
            if not isinstance(summary, str) or len(summary.strip()) < 30:
                return []

            categories = row.get("categories") or []
            primary_category = categories[0] if categories else "default"
            candidate_tags = C.CATEGORY_TO_TAG_SUBSET.get(
                primary_category, C.TOPIC_TAGS
            )

            result = classifier_pipeline(summary, candidate_tags, multi_label=True)  # type: ignore[arg-type]
            tag_scores = list(zip(result.get("labels", []), result.get("scores", [])))

            threshold = 0.40
            filtered = [(tag, score) for tag, score in tag_scores if score > threshold]

            if not filtered and tag_scores:
                tag_scores.sort(key=lambda item: item[1], reverse=True)
                filtered = [tag_scores[0]]

            filtered.sort(key=lambda item: item[1], reverse=True)
            return [tag for tag, _ in filtered][:8]

        except Exception as exc:  # pragma: no cover - logging unexpected errors
            logger.error(
                "Error generating tags for article %s: %s",
                row.get("url", "N/A"),
                exc,
            )
            return []

    df["keywords"] = df.progress_apply(safe_tag, axis=1)
    logger.info("✅ Topic tag generation complete.")
    return df
