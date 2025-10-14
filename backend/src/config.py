import os
from dotenv import load_dotenv

load_dotenv()
# ======================================================================
#   SECRET KEYS (Loaded from .env file)
# ======================================================================
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


# ======================================================================
#   PIPELINE SETTINGS (Things you might want to tune)
# ======================================================================

# GNEWS API settings
GNEWS_URL = "https://gnews.io/api/v4/top-headlines"
GNEWS_FETCH_MODE = os.getenv("GNEWS_FETCH_MODE", "test").lower()  # "prod" or "test"

# The timezone to use for date-based filtering (e.g., "yesterday's" news)
PIPELINE_TIMEZONE = os.getenv("PIPELINE_TIMEZONE", "Asia/Kolkata")

# ======================================================================
#   SOURCE RANKING SETTINGS
# ======================================================================
# The "VIP List" for known, high-quality sources. Lower number = higher priority.
SOURCE_PRIORITY_MAP = {
    "Reuters": 1,
    "Associated Press": 2,
    "BBC News": 3,
    "The New York Times": 3,
    "The Guardian": 4,
    "TechCrunch": 10,
    "The Verge": 10,
}

# Rule-based scoring for unknown sources. Lower score = higher priority.
SOURCE_SCORING_RULES = {
    "base_score": 100,  # The default starting score for any unknown source
    "keywords": {
        # High-value keywords (subtract points to improve rank)
        "Chronicle": -20,
        "Times": -20,
        "Journal": -20,
        "Post": -15,
        "Gazette": -15,
        "Herald": -15,
        "Press": -10,
        "News": -5,
        # Low-value keywords (add points to lower rank)
        "Blog": 20,
        "Express": 15,
    },
}

# Names of the ML models you are using
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
SUMMARIZER_MODEL_NAME = "sshleifer/distilbart-cnn-12-6"
CLASSIFIER_MODEL_NAME = "valhalla/distilbart-mnli-12-1"
