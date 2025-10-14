import feedparser
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from email.utils import parsedate_to_datetime
from utils import get_logger
from src import config as cfg
from src import constants as C
import concurrent.futures

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
        logger.warning(
            "⚠️ RSS_FEEDS dictionary is empty in config.py. Skipping RSS fetch."
        )
        return []

    logger.info(f"🚀 Starting RSS feed fetch for {len(C.RSS_FEEDS)} categories.")

    # --- Date Filtering Setup ---
    try:
        # Set the timezone from the config file
        tz = ZoneInfo(cfg.PIPELINE_TIMEZONE)
    except Exception:
        logger.error(
            f"Invalid timezone '{cfg.PIPELINE_TIMEZONE}' in config. Using UTC."
        )
        tz = ZoneInfo("UTC")

    today = datetime.now(tz).date()
    yesterday = today - timedelta(days=1)
    logger.info(f"Filtering RSS articles for date: {yesterday}")

    all_articles_metadata: List[Dict] = []

    def _parse_datetime_from_entry(entry, feed, tz: ZoneInfo) -> Optional[datetime]:
        """Try multiple fields to extract a publish datetime from an entry.
        Order: published_parsed, updated_parsed, created_parsed, then string fields
        including dc_date/date; finally fallback to channel-level fields.
        Returns timezone-aware datetime in target tz or None.
        """
        # 1) struct_time candidates
        for key in ("published_parsed", "updated_parsed", "created_parsed"):
            dt_struct = getattr(entry, key, None) or entry.get(key)
            if dt_struct:
                try:
                    dt = datetime(*dt_struct[:6], tzinfo=timezone.utc)
                    return dt.astimezone(tz)
                except Exception:
                    pass

        # 2) string candidates in entry
        def _parse_string_date(s: str) -> Optional[datetime]:
            if not s:
                return None
            # Try RFC822
            try:
                dt = parsedate_to_datetime(s)
                if dt is not None:
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    return dt.astimezone(tz)
            except Exception:
                pass
            # Try ISO-8601
            try:
                isostr = s.replace("Z", "+00:00")
                dt = datetime.fromisoformat(isostr)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(tz)
            except Exception:
                return None

        for key in ("published", "updated", "created", "dc_date", "date"):
            val = getattr(entry, key, None) or entry.get(key)
            dt_local = _parse_string_date(val) if isinstance(val, str) else None
            if dt_local:
                return dt_local

        # 3) Fallback: channel-level timestamps (last resort)
        channel = getattr(feed, "feed", {}) or {}
        for key in ("published_parsed", "updated_parsed", "created_parsed"):
            dt_struct = channel.get(key)
            if dt_struct:
                try:
                    dt = datetime(*dt_struct[:6], tzinfo=timezone.utc)
                    return dt.astimezone(tz)
                except Exception:
                    pass
        for key in ("published", "updated", "created", "dc_date", "date"):
            s = channel.get(key)
            if isinstance(s, str):
                dt_local = _parse_string_date(s)
                if dt_local:
                    return dt_local

        return None

    def _process_feed(category: str, source: Dict) -> List[Dict]:
        source_name = source["name"]
        feed_url = source["url"]
        out: List[Dict] = []
        try:
            logger.debug(f"Fetching feed: {source_name} ({feed_url})")
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                published_dt_local = _parse_datetime_from_entry(entry, feed, tz)
                if not published_dt_local:
                    logger.warning(
                        f"Skipping entry in '{source_name}', missing published/updated/created/dc:date."
                    )
                    continue
                if published_dt_local.date() != yesterday:
                    continue
                out.append(
                    {
                        "url": entry.link,
                        "title": entry.get("title", "No Title"),
                        "source_name": source_name,
                        "published_at": published_dt_local.isoformat(),
                        "image_url": None,
                        "source_type": "rss_feed",
                        "initial_category": category,
                    }
                )
        except Exception as e:
            logger.error(f"❌ Failed to process RSS feed '{source_name}': {e}")
        return out

    # Submit all sources to a small thread pool
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for category, sources in C.RSS_FEEDS.items():
            for source in sources:
                futures.append(executor.submit(_process_feed, category, source))
        for fut in concurrent.futures.as_completed(futures):
            try:
                all_articles_metadata.extend(fut.result() or [])
            except Exception as e:
                logger.error(f"❌ RSS worker failure: {e}")

    logger.info(
        f"✅ RSS client finished. Returning {len(all_articles_metadata)} metadata entries from yesterday."
    )
    return all_articles_metadata
