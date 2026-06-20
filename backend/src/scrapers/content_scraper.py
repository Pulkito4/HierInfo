"""
Content Scraper module for scraping article content from news websites.
Includes two-tier fallback system and comprehensive logging.
"""

import time
import random
import asyncio
from urllib.parse import urlparse
from typing import Dict, Optional, List
from newspaper import Article
from playwright.async_api import async_playwright
from utils import get_logger
from src import constants as C
from utils.general_utils import clean_image_url

# Initialize logger
logger = get_logger(__name__)


def is_valid_content(content: dict) -> bool:
    """Helper to check blocking phrases and sufficient length."""
    domain = content.get('domain', 'unknown')
    method = content.get('parsing_method', 'unknown')
    
    # 1. Check for blocking phrases
    lower_content = content["raw_content"].lower()
    if any(phrase in lower_content for phrase in C.BLOCKING_PHRASES):
        logger.warning(
            f"❌ {method} - Found blocking phrase in content from {domain}"
        )
        return False

    # 2. Check for sufficient length
    text_length = len(content["raw_content"])
    if text_length > 150:
        logger.info(
            f"✅ {method} successful - {text_length} chars extracted from {domain}"
        )
        return True
    else:
        logger.warning(
            f"❌ {method} - insufficient content ({text_length} chars) from {domain}"
        )
        return False


def parse_with_newspaper3k(url: str, timeout: int = 15) -> Optional[Dict]:
    """Primary parser using newspaper3k (fastest method)."""
    logger.debug(f"📰 Starting newspaper3k parsing for: {urlparse(url).netloc}")
    try:
        user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
        ]
        article = Article(url)
        article.config.browser_user_agent = random.choice(user_agents)
        article.config.request_timeout = timeout
        article.config.number_threads = 1
        
        logger.debug("🌐 Downloading article content...")
        article.download()
        logger.debug("🔍 Parsing article structure...")
        article.parse()

        clean_img_url = clean_image_url(article.top_image)
        content = {
            "url": url,
            "title": article.title.strip() if article.title else "",
            "raw_content": article.text.strip() if article.text else "",
            "authors": article.authors or [],
            "published_at": article.publish_date,
            "image_url": clean_img_url or "",
            "source_name": "",
            "parsing_method": "newspaper3k",
            "domain": urlparse(url).netloc,
        }

        if is_valid_content(content):
            return content
        return None

    except Exception as e:
        logger.warning(f"❌ newspaper3k failed for {urlparse(url).netloc}: {str(e)}")
        return None


async def async_parse_with_playwright(url: str, timeout: int = 30) -> Optional[Dict]:
    """Secondary parser using Playwright (most reliable for modern sites)."""
    logger.debug(f"🎭 Starting Playwright parsing for: {urlparse(url).netloc}")
    try:
        async with async_playwright() as p:
            logger.debug("🚀 Launching Chromium browser...")
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--disable-web-security",
                    "--disable-features=VizDisplayCompositor",
                    "--disable-blink-features=AutomationControlled",
                    "--no-first-run",
                    "--disable-default-apps",
                ],
            )
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            """)
            page = await context.new_page()
            await page.set_extra_http_headers({
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
            })

            logger.debug(f"🌐 Loading page: {urlparse(url).netloc}")
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout * 1000)
            logger.debug("⏳ Waiting for content to load...")
            await page.wait_for_timeout(3000)

            try:
                await page.wait_for_selector("article, .article, .post-content, .entry-content", timeout=5000)
            except Exception:
                logger.debug("⚠️  No common article selectors found, proceeding with full page")

            html_content = await page.content()
            await browser.close()

            logger.debug("📄 Extracting content with newspaper3k...")
            article = Article(url)
            article.set_html(html_content)
            article.parse()

            clean_img_url = clean_image_url(article.top_image)
            content = {
                "url": url,
                "title": article.title.strip() if article.title else "",
                "raw_content": article.text.strip() if article.text else "",
                "authors": article.authors or [],
                "published_at": article.publish_date,
                "image_url": clean_img_url or "",
                "source_name": "",
                "parsing_method": "playwright",
                "domain": urlparse(url).netloc,
            }

            if is_valid_content(content):
                return content
            return None

    except Exception as e:
        logger.warning(f"❌ Playwright failed for {urlparse(url).netloc}: {str(e)}")
        return None


async def async_parse_article_two_tier(url: str, semaphore: asyncio.Semaphore) -> Optional[Dict]:
    """Async two-tier fallback parsing strategy."""
    domain = urlparse(url).netloc
    logger.info(f"🎯 Starting two-tier parsing for: {domain}")
    
    # Tier 1: newspaper3k (run in a background thread to not block the asyncio loop)
    logger.info(f"🔄 Tier 1: Trying newspaper3k (Fast lightweight parser)")
    try:
        content = await asyncio.to_thread(parse_with_newspaper3k, url)
        if content:
            return content
        else:
            logger.warning(f"⚠️  newspaper3k returned insufficient content for {domain}, trying next method...")
    except Exception as e:
        logger.warning(f"💥 newspaper3k encountered error for {domain}: {str(e)}")
        
    await asyncio.sleep(1)

    # Tier 2: Playwright (async, controlled by semaphore)
    logger.info(f"🔄 Tier 2: Trying Playwright (Browser-based reliable parser)")
    try:
        async with semaphore:
            content = await async_parse_with_playwright(url)
            if content:
                return content
    except Exception as e:
        logger.warning(f"💥 Playwright encountered error for {domain}: {str(e)}")

    logger.error(f"💀 All parsing methods failed for {domain}")
    return None


def parse_articles_batch(urls: List[str], max_workers: int = 10) -> List[Dict]:
    """Parse multiple articles concurrently using asyncio."""
    logger.info(f"🚀 Starting batch parsing of {len(urls)} articles with {max_workers} Playwright workers")
    if not urls:
        logger.warning("⚠️ parse_articles_batch received an empty list of URLs.")
        return []

    async def run_batch():
        # Semaphore limits the number of concurrent Playwright browser instances
        semaphore = asyncio.Semaphore(max_workers)
        tasks = [async_parse_article_two_tier(url, semaphore) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=True)

    try:
        # Run the asyncio event loop
        results = asyncio.run(run_batch())
    except Exception as e:
        logger.error(f"💥 Fatal error running async batch: {e}")
        return []

    parsed_articles = []
    failed_count = 0
    
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"💥 Batch task exception: {result}")
            failed_count += 1
        elif result:
            parsed_articles.append(result)
        else:
            failed_count += 1

    success_count = len(parsed_articles)
    total_count = len(urls)
    success_rate = (success_count / total_count) * 100 if total_count > 0 else 0

    logger.info(f"📊 Batch parsing completed: {success_count}/{total_count} articles successful ({success_rate:.1f}%)")
    return parsed_articles
