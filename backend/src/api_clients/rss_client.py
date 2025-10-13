import feedparser
from typing import List, Dict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from utils import get_logger
from src import config as cfg
from src import constants as C

logger = get_logger(__name__)

def fetch_rss_metadata() -> List[Dict]:
    """
    Fetches article metadata from RSS feeds and filters them to include
    only articles published "yesterday" based on the PIPELINE_TIMEZONE.
    This function does NOT scrape content.

    Returns:
        List[Dict]: A list of dictionaries for articles published yesterday.
    """
    if not C.RSS_FEEDS:
        logger.warning("⚠️ RSS_FEEDS dictionary is empty in config.py. Skipping RSS fetch.")
        return []

    logger.info(f"🚀 Starting RSS feed fetch for {len(C.RSS_FEEDS)} categories.")

    # --- Date Filtering Setup ---
    try:
        # Set the timezone from the config file
        tz = ZoneInfo(cfg.PIPELINE_TIMEZONE)
    except Exception:
        logger.error(f"Invalid timezone '{cfg.PIPELINE_TIMEZONE}' in config. Using UTC.")
        tz = ZoneInfo("UTC")
        
    today = datetime.now(tz).date()
    yesterday = today - timedelta(days=1)
    logger.info(f"Filtering RSS articles for date: {yesterday}")
    
    all_articles_metadata = []
    
    # Loop through each category and its list of sources
    for category, sources in C.RSS_FEEDS.items():
        for source in sources:
            source_name = source['name']
            feed_url = source['url']
            
            try:
                logger.debug(f"Fetching feed: {source_name} ({feed_url})")
                feed = feedparser.parse(feed_url)

                for entry in feed.entries:
                    # --- Date Parsing & Filtering Logic ---
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        # Create a timezone-aware UTC datetime from parsed tuple
                        published_dt_utc = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                        # Convert it to the target timezone
                        published_dt_local = published_dt_utc.astimezone(tz)
                        
                        # Check if the article's date matches yesterday
                        if published_dt_local.date() != yesterday:
                            continue # Skip to the next article
                    else:
                        logger.warning(f"Skipping entry in '{source_name}', missing published date.")
                        continue # Skip if no published date is available

                    # --- If date matches, format the metadata ---
                    article_meta = {
                        'url': entry.link,
                        'title': entry.get('title', 'No Title'),
                        'source_name': source_name,
                        'published_at': published_dt_local.isoformat(),  # Store as timezone-aware string
                        'image_url': None,
                        'source_type': 'rss_feed',
                        'initial_category': category
                    }
                    all_articles_metadata.append(article_meta)

            except Exception as e:
                logger.error(f"❌ Failed to process RSS feed '{source_name}': {e}")
                continue
            
    logger.info(f"✅ RSS client finished. Returning {len(all_articles_metadata)} metadata entries from yesterday.")
    return all_articles_metadata