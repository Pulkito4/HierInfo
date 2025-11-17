# ======================================================================
#   GNEWS API CONSTANTS (Defined by the GNews service)
# ======================================================================
# Available categories as per GNews API documentation
GNEWS_CATEGORIES = [
    "general",
    "world",
    "nation",
    "business",
    "technology",
    "entertainment",
    "sports",
    "science",
    "health",
]

# Countries you want to fetch news from
GNEWS_COUNTRIES = ["in", "us", "gb"]  # India, United States, United Kingdom


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
        {"name": "BBC World", "url": "https://feeds.bbci.co.uk/news/world/rss.xml"},
        { "name": "NPR World", "url": "https://feeds.npr.org/1004/rss.xml" },
        { "name": "The Guardian World", "url": "https://www.theguardian.com/world/rss" },
        { "name": "Al Jazeera World", "url": "https://www.aljazeera.com/xml/rss/all.xml" },
        { "name": "DW World", "url": "https://rss.dw.com/rdf/rss-en-all" }
    ],
    "business": [
        {
            "name": "BBC Business",
            "url": "https://feeds.bbci.co.uk/news/business/rss.xml",
        },
        { "name": "NPR Business", "url": "https://feeds.npr.org/1006/rss.xml" }
    ],
    "technology": [
        {
            "name": "BBC Technology",
            "url": "https://feeds.bbci.co.uk/news/technology/rss.xml",
        },
        { "name": "NPR Technology", "url": "https://feeds.npr.org/1019/rss.xml" }
    ],
    "science": [
        {
            "name": "BBC Science & Environment",
            "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        },
        { "name": "NPR Science", "url": "https://feeds.npr.org/1007/rss.xml" }
    ],
    "health": [
        {"name": "BBC Health", "url": "https://feeds.bbci.co.uk/news/health/rss.xml"},
        { "name": "NPR Health", "url": "https://feeds.npr.org/1128/rss.xml" }
    ],
    "sports": [
        {"name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml"},
    ],
    "top_stories": [
      { "name": "BBC Top Stories", "url": "https://feeds.bbci.co.uk/news/rss.xml" },
    ]
}


# ======================================================================
# SCRAPPER CONSTANTS
# ======================================================================

# A list of phrases that indicate a page is blocked or region-locked.
# The scraper will fail if it finds any of these in the extracted text.
# All checks are case-insensitive.
BLOCKING_PHRASES = [
    "not available in your country",
    "not available in your region",
    "access is denied",
    "content is not available",
    "enable javascript to view this site",
    "site is not available",
]

# ======================================================================
#   CRITICAL NEWS DETECTION CONSTANTS
# ======================================================================

# Phrases that will flag an article as "critical".
# Using multi-word phrases and word boundaries reduces false positives.
CRITICAL_NEWS_PHRASES = [
    r"\bbreaking news\b",
    r"\bpublic safety alert\b",
    r"\bnational emergency\b",
    r"\bstate of emergency\b",
    r"\bdeclaration of war\b",
    r"\bmilitary action\b",
    r"\bmarket crash\b",
    r"\beconomic collapse\b",
    r"\bassassination\b",
    r"\bcoup d\'état\b",
    r"\bimpeachment proceedings\b",
    r"\bpandemic declared\b",
    r"\bglobal health emergency\b",
    r"\bcategory 5 hurricane\b",
    r"\btsunami warning\b",
    r"\bmassive earthquake\b",
]

# The minimum trending score an article needs to be considered for the critical flag.
CRITICAL_TRENDING_THRESHOLD = 5


# ======================================================================
#   ARTICLE CATEGORIZATION CONSTANTS
# ======================================================================

# Categories for Zero-Shot Classification
ARTICLE_CATEGORIES = [
    "Politics",
    "Business",
    "Technology",
    "Health",
    "Science",
    "Entertainment",
    "Sports",
    "World News",
    "Environment",
    "Education",
    "Travel",
    "Food",
    "Culture",
    "Economy",
    "Law",
    "Crime",
    "Social Issues",
    "Human Rights",
]

# Topic Tags for the 'keywords' field
# Mid-level tags for the hierarchical zero-shot tagger
TOPIC_TAGS = [
    # Health & Science
    "Public Health",
    "Medical Research",
    "Nutrition",
    "Diet",
    "Mental Health",
    "Genetics",
    "Space Exploration",
    "Environmental Science",
    "Climate Change",
    "Epidemiology",
    "Vaccines",
    "Pharmaceuticals",
    "Neuroscience",
    "Healthcare Policy",
    "Biotechnology",
    "Sustainability",
    "Renewable Energy",
    # Technology
    "Artificial Intelligence",
    "Cybersecurity",
    "Software Development",
    "Data Privacy",
    "Robotics",
    "Cloud Computing",
    "Blockchain",
    "Tech Innovation",
    "Quantum Computing",
    "Gadgets",
    "Startups",
    "Mobile Tech",
    "Gaming",
    "5G Networks",
    # Business & Economy
    "Stock Market",
    "Corporate News",
    "Global Economy",
    "Inflation",
    "Trade",
    "Entrepreneurship",
    "Venture Capital",
    "Mergers & Acquisitions",
    "Real Estate",
    "Employment",
    "Economic Policy",
    "Personal Finance",
    "Banking",
    "Cryptocurrency",
    "Market Regulation",
    # Politics / Governance / World
    "Elections",
    "International Relations",
    "Government Policy",
    "Public Administration",
    "Diplomacy",
    "Corruption",
    "Legislation",
    "Conflict",
    "Political Parties",
    "Protests",
    "Foreign Policy",
    "Geopolitics",
    "Defense & Security",
    # Environment
    "Biodiversity",
    "Climate Policy",
    "Wildlife Conservation",
    "Energy Policy",
    "Oceanography",
    "Pollution Control",
    "Natural Resources",
    "Environmental Policy",
    # Society / Culture / Education
    "Social Issues",
    "Social Justice",
    "Gender Equality",
    "Migration",
    "Youth",
    "Education",
    "Higher Education",
    "Online Learning",
    "School Policy",
    "Demographics",
    "Cultural Heritage",
    "Arts & Culture",
    "Pop Culture",
    "Fashion",
    "Literature",
    "Music",
    "Movies",
    "Television",
    "Performing Arts",
    # Sports
    "Football",
    "Cricket",
    "Basketball",
    "Tennis",
    "Olympics",
    "Athletics",
    "Esports",
    "Team Sports",
    "Individual Sports",
    "Sports Business",
    "Sports Science",
    "Sports Medicine",
    # Travel & Food
    "Travel",
    "Tourism Industry",
    "Sustainable Travel",
    "Adventure Travel",
    "Food & Drink",
    "Culinary Trends",
    "Local Cuisine",
    "Hospitality Industry",
    "Lifestyle",
    "Wellness Tourism",
    # Law / Crime / Human Rights
    "Law & Crime",
    "Judiciary",
    "Legal Reform",
    "Civil Rights",
    "Privacy Rights",
    "International Law",
    "Cybercrime",
    "Justice System",
    "Human Rights",
    "Gender Rights",
    "Freedom of Speech",
    "Refugee Rights",
]


# Mapping from broad category to specific topic tags ---
CATEGORY_TO_TAG_SUBSET = {
    "Health": [
        "Public Health",
        "Medical Research",
        "Nutrition",
        "Diet",
        "Mental Health",
        "Vaccines",
        "Healthcare Policy",
        "Pharmaceuticals",
    ],
    "Science": [
        "Genetics",
        "Space Exploration",
        "Neuroscience",
        "Biotechnology",
        "Environmental Science",
        "Sustainability",
        "Renewable Energy",
    ],
    "Technology": [
        "Artificial Intelligence",
        "Cybersecurity",
        "Software Development",
        "Data Privacy",
        "Robotics",
        "Blockchain",
        "Cloud Computing",
        "Tech Innovation",
        "Quantum Computing",
    ],
    "Business": [
        "Stock Market",
        "Corporate News",
        "Entrepreneurship",
        "Venture Capital",
        "Mergers & Acquisitions",
        "Real Estate",
        "Banking",
        "Employment",
    ],
    "Economy": [
        "Global Economy",
        "Inflation",
        "Trade",
        "Economic Policy",
        "Market Regulation",
        "Cryptocurrency",
        "Personal Finance",
    ],
    "Politics": [
        "Elections",
        "Government Policy",
        "Legislation",
        "Corruption",
        "Public Administration",
        "Political Parties",
        "Diplomacy",
        "Defense & Security",
    ],
    "World News": [
        "International Relations",
        "Conflict",
        "Foreign Policy",
        "Geopolitics",
        "Human Rights",
        "Global Economy",
        "Diplomacy",
    ],
    "Environment": [
        "Climate Change",
        "Environmental Policy",
        "Biodiversity",
        "Renewable Energy",
        "Wildlife Conservation",
        "Energy Policy",
        "Pollution Control",
    ],
    "Law": [
        "Law & Crime",
        "Judiciary",
        "Legal Reform",
        "International Law",
        "Civil Rights",
        "Privacy Rights",
    ],
    "Crime": ["Law & Crime", "Cybercrime", "Corruption", "Justice System"],
    "Social Issues": [
        "Social Issues",
        "Social Justice",
        "Gender Equality",
        "Migration",
        "Youth",
        "Demographics",
    ],
    "Human Rights": [
        "Human Rights",
        "Civil Rights",
        "Gender Rights",
        "Refugee Rights",
        "Freedom of Speech",
    ],
    "Culture": [
        "Arts & Culture",
        "Cultural Heritage",
        "Literature",
        "Fashion",
        "Music",
        "Movies",
        "Performing Arts",
        "Pop Culture",
    ],
    "Entertainment": [
        "Movies",
        "Television",
        "Music",
        "Pop Culture",
        "Fashion",
        "Performing Arts",
    ],
    "Education": [
        "Education",
        "Higher Education",
        "Online Learning",
        "School Policy",
        "Youth",
    ],
    "Sports": [
        "Football",
        "Cricket",
        "Basketball",
        "Tennis",
        "Olympics",
        "Team Sports",
        "Individual Sports",
        "Esports",
        "Sports Science",
    ],
    "Travel": [
        "Travel",
        "Tourism Industry",
        "Adventure Travel",
        "Sustainable Travel",
        "Hospitality Industry",
        "Lifestyle",
        "Wellness Tourism",
    ],
    "Food": ["Food & Drink", "Culinary Trends", "Local Cuisine", "Nutrition"],
    "default": TOPIC_TAGS,
}
