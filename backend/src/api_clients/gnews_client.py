import time
import requests
from typing import List, Dict
from utils import get_logger
from src import config as cfg
from src import constants as C

logger = get_logger(__name__)

# Create a session with retries and sensible defaults to improve resilience
_session = requests.Session()
try:
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
    )
    _session.mount("https://", HTTPAdapter(max_retries=retries))
    _session.mount("http://", HTTPAdapter(max_retries=retries))
except Exception:
    # If Retry isn't available, continue with basic Session
    pass
def _fetch_gnews_page(api_key: str, category: str, country: str, page: int) -> List[Dict]:
    """
    (Internal) Fetches a single page of article metadata from GNews API
    with production-grade error handling.
    """
    params = {
        'category': category,
        'country': country,
        'lang': 'en',
        'max': C.MAX_ARTICLES_PER_PAGE,
        'page': page,
        'apikey': api_key
    }

    try:
        response = _session.get(cfg.GNEWS_URL, params=params, timeout=20)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()
        articles = data.get('articles', [])
        logger.debug(f"Successfully fetched {len(articles)} articles for {country.upper()}-{category} (Page {page})")
        return articles
    except requests.exceptions.HTTPError as http_err:
        if response.status_code in [429, 403]:
            logger.info(f"Rate limit or page limit reached for {country.upper()}-{category}. Stopping for this category.")
        else:
            logger.error(f"HTTP error fetching page: {http_err}")
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Network error fetching page: {req_err}")
    
    return []

def fetch_gnews_metadata() -> List[Dict]:
    """
    Fetches article metadata from GNews by distributing the API quota
    evenly across specified countries to ensure diverse news coverage.
    The run mode ('prod' or 'test') is controlled by the PIPELINE_MODE in config.

    Returns:
        List[Dict]: A list of dictionaries, each containing article metadata.
    """
    api_key = cfg.GNEWS_API_KEY
    if not api_key:
        logger.critical("❌ GNEWS_API_KEY not found. Cannot proceed.")
        raise ValueError("GNEWS_API_KEY is not set.")

    # Get the pipeline mode from the central config file
    mode = cfg.GNEWS_FETCH_MODE.lower() # 'prod' or 'test'

    if mode == 'prod':
        logger.info("🚀 Starting GNews fetch in PRODUCTION mode.")
        total_requests_limit = 100
        countries_to_fetch = C.GNEWS_COUNTRIES
        categories_to_fetch = C.GNEWS_CATEGORIES
        
        if not countries_to_fetch:
            logger.error("No countries defined in constants.py. Halting.")
            return []

        # ** THE CORRECTED LOGIC: Allocate a budget for each country **
        num_countries = len(countries_to_fetch)
        requests_per_country = total_requests_limit // num_countries
        logger.info(f"📊 Distributing {total_requests_limit} requests across {num_countries} countries (~{requests_per_country} each).")
    else:
        logger.info("🧪 Starting GNews fetch in TEST mode.")
        requests_per_country = 2
        countries_to_fetch = [C.GNEWS_COUNTRIES[0]] if C.GNEWS_COUNTRIES else []
        categories_to_fetch = [C.GNEWS_CATEGORIES[0]] if C.GNEWS_CATEGORIES else []

    all_articles = []
    total_requests_made = 0

    # Loop through each country and spend its allocated budget
    for country in countries_to_fetch:
        requests_for_this_country = 0
        logger.info(f"--- Fetching for country: {country.upper()} (Budget: {requests_per_country} requests) ---")
        
        for category in categories_to_fetch:
            if requests_for_this_country >= requests_per_country:
                break
            for page_num in range(1, C.MAX_PAGES_PER_QUERY + 1):
                if requests_for_this_country >= requests_per_country:
                    logger.info(f"Budget for {country.upper()} exhausted. Moving to next country.")
                    break

                logger.info(f"Fetching: {country.upper()}-{category}, Page {page_num} (Request #{requests_for_this_country + 1} for this country)")
                
                page_articles = _fetch_gnews_page(api_key, category, country, page_num)
                
                requests_for_this_country += 1
                total_requests_made += 1
                
                if not page_articles:
                    break # No more articles for this category, move to the next one
                
                all_articles.extend(page_articles)
                time.sleep(1)
    
    # --- Final Formatting Step ---
    logger.info(f"Formatting {len(all_articles)} raw articles into a clean metadata list...")
    formatted_metadata = []
    for article in all_articles:
        formatted_metadata.append({
            'url': article['url'],
            'title': article.get('title', ''),
            'source_name': article.get('source', {}).get('name', ''),
            'published_at': article.get('publishedAt'),
            'image_url': article.get('image', ''),
            'source_type': 'gnews_api'
        })
    
    logger.info(f"✅ GNews client finished. Returning {len(formatted_metadata)} metadata entries after making {total_requests_made} total requests.")
    return formatted_metadata