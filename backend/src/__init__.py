# API Clients
from .api_clients import fetch_gnews_metadata, fetch_rss_metadata

# Database
from .database import SupabaseManager

# Processing
from .processing import (
    generate_embeddings,
    cluster_and_deduplicate,
    generate_summaries,
    set_critical_flag,
    generate_keywords,
    generate_categories,
    apply_nlp_processing,
)

# Scrapers
from .scrapers import parse_articles_batch

# Configuration modules
from . import constants
from . import config

__all__ = [
    # API Clients
    "fetch_gnews_metadata",
    "fetch_rss_metadata",
    # Database
    "SupabaseManager",
    # Processing
    "generate_embeddings",
    "cluster_and_deduplicate",
    "generate_summaries",
    "set_critical_flag",
    "generate_keywords",
    "generate_categories",
    "apply_nlp_processing",
    # Scrapers
    "parse_articles_batch",
    # Config modules
    "constants",
    "config",
]
