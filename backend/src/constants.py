# ======================================================================
#   GNEWS API CONSTANTS (Defined by the GNews service)
# ======================================================================
# Available categories as per GNews API documentation
GNEWS_CATEGORIES = [
    'general', 'world', 'nation', 'business', 'technology',
    'entertainment', 'sports', 'science', 'health'
]

# Countries you want to fetch news from
GNEWS_COUNTRIES = ['in', 'us', 'gb'] # India, United States, United Kingdom


# ======================================================================
#   PIPELINE CONSTANTS
# ======================================================================
# Maximum articles per GNews request (defined by their free tier)
MAX_ARTICLES_PER_PAGE = 10

# Maximum pages per GNews query (defined by us as per our logic)
MAX_PAGES_PER_QUERY = 10

# ======================================================================
#   RSS FEEDS (You can modify this as needed)
# ======================================================================
# List of RSS feeds to fetch
RSS_FEEDS = {
    "world": [
    { "name": "BBC World", "url": "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { "name": "CNN World", "url": "http://rss.cnn.com/rss/edition_world.rss" },
    { "name": "NPR World", "url": "https://feeds.npr.org/1004/rss.xml" },
    { "name": "The Guardian World", "url": "https://www.theguardian.com/world/rss" },
    { "name": "Al Jazeera World", "url": "https://www.aljazeera.com/xml/rss/all.xml" },
    { "name": "DW World", "url": "https://rss.dw.com/rdf/rss-en-all" }
  ],
  "business": [
    { "name": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml" },
    { "name": "CNN Business", "url": "http://rss.cnn.com/rss/money_news_international.rss" },
    { "name": "NPR Business", "url": "https://feeds.npr.org/1006/rss.xml" }
  ],
  "technology": [
    { "name": "BBC Technology", "url": "https://feeds.bbci.co.uk/news/technology/rss.xml" },
    { "name": "CNN Technology", "url": "http://rss.cnn.com/rss/edition_technology.rss" },
    { "name": "NPR Technology", "url": "https://feeds.npr.org/1019/rss.xml" }
  ],
  "science": [
    { "name": "BBC Science & Environment", "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
    { "name": "NPR Science", "url": "https://feeds.npr.org/1007/rss.xml" }
  ],
  "health": [
    { "name": "BBC Health", "url": "https://feeds.bbci.co.uk/news/health/rss.xml" },
    { "name": "NPR Health", "url": "https://feeds.npr.org/1128/rss.xml" }
  ],
  "sports": [
    { "name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml" },
    { "name": "CNN Sports", "url": "http://rss.cnn.com/rss/edition_sport.rss" }
  ],
  "top_stories": [
    { "name": "BBC Top Stories", "url": "https://feeds.bbci.co.uk/news/rss.xml" },
    { "name": "CNN Top Stories", "url": "http://rss.cnn.com/rss/edition.rss" }
  ]
}


# ======================================================================
# OTHER CONSTANTS
# ======================================================================

# Phrases that will flag an article as "critical".
# Using multi-word phrases and word boundaries reduces false positives.
CRITICAL_NEWS_PHRASES = [
    r'\bbreaking news\b', r'\bpublic safety alert\b', r'\bnational emergency\b',
    r'\bstate of emergency\b', r'\bdeclaration of war\b', r'\bmilitary action\b',
    r'\bmarket crash\b', r'\beconomic collapse\b', r'\bassassination\b',
    r'\bcoup d\'état\b', r'\bimpeachment proceedings\b', r'\bpandemic declared\b',
    r'\bglobal health emergency\b', r'\bcategory 5 hurricane\b', r'\btsunami warning\b',
    r'\bmassive earthquake\b'
]

# The minimum trending score an article needs to be considered for the critical flag.
CRITICAL_TRENDING_THRESHOLD = 5


# Categories for Zero-Shot Classification
ARTICLE_CATEGORIES = [
    "Politics", "Business", "Technology", "Health", "Science",
    "Entertainment", "Sports", "World News", "Environment", "Education",
    "Travel", "Food", "Culture", "Economy", "Law", "Crime",
    "Social Issues", "Human Rights"
]