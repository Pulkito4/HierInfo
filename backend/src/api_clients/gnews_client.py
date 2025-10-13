import requests
from typing import List, Dict, Tuple
import threading
import time
import random
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

# Simple per-host throttle with jittered backoff to avoid bursty traffic
_host_lock = threading.Lock()
_last_call_ts: Dict[str, float] = {}
_MIN_INTERVAL_SEC = 0.25  # base min gap between calls per host
_JITTER_MAX_SEC = 0.25    # up to this much extra jitter

def _throttle(host: str) -> None:
    now = time.monotonic()
    with _host_lock:
        last = _last_call_ts.get(host, 0.0)
        gap = _MIN_INTERVAL_SEC - (now - last)
        if gap > 0:
            time.sleep(gap + random.uniform(0, _JITTER_MAX_SEC))
        _last_call_ts[host] = time.monotonic()

def _fetch_gnews_page(api_key: str, category: str, country: str, page: int) -> Tuple[List[Dict], bool]:
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

    success = True
    try:
        # Respect a minimal per-host interval with jitter
        from urllib.parse import urlparse
        host = urlparse(cfg.GNEWS_URL).netloc
        _throttle(host)

        response = _session.get(cfg.GNEWS_URL, params=params, timeout=20)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()
        articles = data.get('articles', [])
        logger.debug(f"Successfully fetched {len(articles)} articles for {country.upper()}-{category} (Page {page})")
        return articles, success
    except requests.exceptions.HTTPError as http_err:
        if response.status_code in [429, 403]:
            logger.info(f"Rate limit or page limit reached for {country.upper()}-{category}. Stopping for this category.")
        else:
            logger.error(f"HTTP error fetching page: {http_err}")
        success = False
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Network error fetching page: {req_err}")
        success = False
    
    return [], success

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

    all_articles: List[Dict] = []
    total_requests_made = 0

    # Build tasks per country up to its budget and fetch with a small thread pool
    import concurrent.futures

    for country in countries_to_fetch:
        logger.info(f"--- Fetching for country: {country.upper()} (Budget: {requests_per_country} requests) ---")

        tasks: List[Tuple[str, str, int]] = []  # (category, country, page)
        remaining = requests_per_country
        for category in categories_to_fetch:
            for page_num in range(1, C.MAX_PAGES_PER_QUERY + 1):
                if remaining <= 0:
                    break
                tasks.append((category, country, page_num))
                remaining -= 1
            if remaining <= 0:
                break

        total_requests_made += len(tasks)
        if not tasks:
            continue

        # Fetch pages concurrently with a conservative worker count
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_task = {
                executor.submit(_fetch_gnews_page, api_key, category, country, page): (category, country, page)
                for (category, country, page) in tasks
            }
            batch_success = 0
            batch_fail = 0
            for future in concurrent.futures.as_completed(future_to_task):
                try:
                    page_articles, ok = future.result()
                    if ok:
                        batch_success += 1
                    else:
                        batch_fail += 1
                    if page_articles:
                        all_articles.extend(page_articles)
                except Exception as e:
                    cat, ctry, pg = future_to_task[future]
                    logger.error(f"❌ GNews task failed for {ctry.upper()}-{cat} page {pg}: {e}")
                    batch_fail += 1

        total = len(tasks)
        logger.info(
            f"📊 GNews batch for {country.upper()}: success {batch_success}/{total}, fail {batch_fail}/{total}"
        )
    
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