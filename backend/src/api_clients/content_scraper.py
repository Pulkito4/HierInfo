"""
Content Scraper - Production Version

Production-ready module for scraping article content from news websites.
Includes two-tier fallback system and comprehensive logging.
"""

import time
import random
from urllib.parse import urlparse
from typing import Dict, Optional, List
import concurrent.futures
from newspaper import Article
from playwright.sync_api import sync_playwright
from utils.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)

def parse_with_newspaper3k(url: str, timeout: int = 15) -> Optional[Dict]:
    """
    Primary parser using newspaper3k (fastest method).
    
    This method is lightweight and fast, making it ideal for the first attempt
    at parsing articles. It works well with most traditional news sites.
    
    Args:
        url (str): Article URL to parse
        timeout (int): Request timeout in seconds
        
    Returns:
        Optional[Dict]: Parsed content in standardized format or None if failed
    """
    
    logger.debug(f"📰 Starting newspaper3k parsing for: {urlparse(url).netloc}")
    
    try:
        # Rotate user agents for better success and anti-bot evasion
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15'
        ]
        
        # Configure article with custom headers and settings
        article = Article(url)
        article.config.browser_user_agent = random.choice(user_agents)
        article.config.request_timeout = timeout
        article.config.number_threads = 1  # Single thread for stability
        
        # Download and parse the article
        logger.debug(f"🌐 Downloading article content...")
        article.download()
        
        logger.debug(f"🔍 Parsing article structure...")
        article.parse()
        
        # Extract content in standardized format for DataFrame compatibility
        content = {
            'url': url,
            'title': article.title.strip() if article.title else '',
            'text': article.text.strip() if article.text else '',
            'authors': article.authors or [],
            'published_at': article.publish_date,
            'image_url': article.top_image or '',
            'source_name': '',  # Will be populated from GNews API data
            'method': 'newspaper3k',
            'domain': urlparse(url).netloc
        }
        
        # Validate content quality
        text_length = len(content['text'])
        if content['text'] and text_length > 100:
            logger.info(f"✅ newspaper3k successful - {text_length} chars extracted from {content['domain']}")
            logger.debug(f"📝 Title: {content['title'][:100]}...")
            return content
        else:
            logger.warning(f"❌ newspaper3k - insufficient content ({text_length} chars) from {content['domain']}")
            return None
        
    except Exception as e:
        logger.warning(f"❌ newspaper3k failed for {urlparse(url).netloc}: {str(e)}")
        return None

def parse_with_playwright(url: str, timeout: int = 30) -> Optional[Dict]:
    """
    Secondary parser using Playwright (most reliable for modern sites).
    
    This method uses a real browser to handle JavaScript-heavy sites and
    anti-bot protection. It's slower but more reliable for modern news sites.
    
    Args:
        url (str): Article URL to parse
        timeout (int): Browser timeout in seconds
        
    Returns:
        Optional[Dict]: Parsed content in standardized format or None if failed
    """
    
    logger.debug(f"🎭 Starting Playwright parsing for: {urlparse(url).netloc}")
    
    try:
        with sync_playwright() as p:
            # Launch browser with stealth options for anti-bot evasion
            logger.debug("🚀 Launching Chromium browser...")
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-blink-features=AutomationControlled',
                    '--no-first-run',
                    '--disable-default-apps'
                ]
            )
            
            # Create context with realistic viewport and user agent
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Hide automation indicators for better success rates
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                window.chrome = {
                    runtime: {},
                };
                
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
            """)
            
            page = context.new_page()
            
            # Set additional headers for realistic requests
            page.set_extra_http_headers({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            })
            
            logger.debug(f"🌐 Loading page: {urlparse(url).netloc}")
            
            # Navigate to URL with timeout
            page.goto(url, wait_until='domcontentloaded', timeout=timeout * 1000)
            
            # Wait for content to load and any dynamic content
            logger.debug("⏳ Waiting for content to load...")
            page.wait_for_timeout(3000)
            
            # Try to wait for common article selectors
            try:
                page.wait_for_selector('article, .article, .post-content, .entry-content', timeout=5000)
            except:
                logger.debug("⚠️  No common article selectors found, proceeding with full page")
            
            # Get page content
            html_content = page.content()
            
            # Close browser to free resources
            browser.close()
            
            logger.debug("📄 Extracting content with newspaper3k...")
            
            # Parse HTML with newspaper3k
            article = Article(url)
            article.set_html(html_content)
            article.parse()
            
            # Extract content in standardized format for DataFrame compatibility
            content = {
                'url': url,
                'title': article.title.strip() if article.title else '',
                'text': article.text.strip() if article.text else '',
                'authors': article.authors or [],
                'published_at': article.publish_date,
                'image_url': article.top_image or '',
                'source_name': '',  # Will be populated from GNews API data
                'method': 'playwright',
                'domain': urlparse(url).netloc
            }
            
            # Validate content quality
            text_length = len(content['text'])
            if content['text'] and text_length > 100:
                logger.info(f"✅ Playwright successful - {text_length} chars extracted from {content['domain']}")
                logger.debug(f"📝 Title: {content['title'][:100]}...")
                return content
            else:
                logger.warning(f"❌ Playwright - insufficient content ({text_length} chars) from {content['domain']}")
                return None
            
    except Exception as e:
        logger.warning(f"❌ Playwright failed for {urlparse(url).netloc}: {str(e)}")
        return None

def parse_article_with_two_tier_fallback(url: str) -> Optional[Dict]:
    """
    Two-tier fallback parsing strategy for maximum reliability.
    
    This is the main parsing function that should be used for production.
    It tries newspaper3k first (fast), then falls back to Playwright (reliable).
    
    Strategy:
    1. newspaper3k (fast, lightweight) - works for most traditional sites
    2. Playwright (slower, more reliable) - handles modern JavaScript sites
    
    Args:
        url (str): Article URL to parse
        
    Returns:
        Optional[Dict]: Parsed content in standardized format or None if all methods fail
    """
    
    domain = urlparse(url).netloc
    logger.info(f"🎯 Starting two-tier parsing for: {domain}")
    logger.debug(f"🔗 Full URL: {url}")
    
    # Define parsing methods in order of preference
    parsing_methods = [
        ("newspaper3k", parse_with_newspaper3k, "Fast lightweight parser"),
        ("Playwright", parse_with_playwright, "Browser-based reliable parser")
    ]
    
    for tier, (method_name, parser_func, description) in enumerate(parsing_methods, 1):
        logger.info(f"🔄 Tier {tier}: Trying {method_name} ({description})")
        
        try:
            # Attempt parsing with current method
            content = parser_func(url)
            
            if content and content.get('text') and len(content['text']) > 100:
                logger.info(f"🎉 SUCCESS! {method_name} extracted {len(content['text'])} characters from {domain}")
                
                # Log success details for monitoring
                logger.debug(f"📊 Success details:")
                logger.debug(f"   Method: {method_name}")
                logger.debug(f"   Domain: {domain}")
                logger.debug(f"   Content length: {len(content['text'])} chars")
                logger.debug(f"   Title: {content['title'][:100]}...")
                
                return content
            else:
                logger.warning(f"⚠️  {method_name} returned insufficient content for {domain}, trying next method...")
                
        except Exception as e:
            logger.warning(f"💥 {method_name} encountered error for {domain}: {str(e)}")
            logger.debug(f"🔄 Moving to next parsing method...")
        
        # Add delay between attempts to be respectful to servers
        if tier < len(parsing_methods):
            wait_time = 2
            logger.debug(f"⏳ Waiting {wait_time} seconds before next method...")
            time.sleep(wait_time)
    
    # All parsing methods failed
    logger.error(f"💀 All parsing methods failed for {domain}")
    return None

def parse_articles_batch(urls: List[str], max_workers: int = 5) -> List[Dict]:
    """
    Parse multiple articles concurrently for better performance.
    
    This function is designed for production use where you need to parse
    many articles efficiently. It uses ThreadPoolExecutor for concurrent processing.
    
    Args:
        urls (List[str]): List of article URLs to parse
        max_workers (int): Maximum number of concurrent workers
        
    Returns:
        List[Dict]: List of successfully parsed articles
    """
    
    logger.info(f"🚀 Starting batch parsing of {len(urls)} articles with {max_workers} workers")
    
    parsed_articles = []
    failed_count = 0
    
    # Use ThreadPoolExecutor for concurrent parsing
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all parsing tasks
        future_to_url = {
            executor.submit(parse_article_with_two_tier_fallback, url): url 
            for url in urls
        }
        
        # Process completed tasks
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            
            try:
                result = future.result()
                if result:
                    parsed_articles.append(result)
                    logger.debug(f"✅ Batch parse success: {urlparse(url).netloc}")
                else:
                    failed_count += 1
                    logger.warning(f"❌ Batch parse failed: {urlparse(url).netloc}")
                    
            except Exception as e:
                failed_count += 1
                logger.error(f"💥 Batch parse exception for {urlparse(url).netloc}: {str(e)}")
    
    # Log batch results
    success_count = len(parsed_articles)
    total_count = len(urls)
    success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
    
    logger.info(f"📊 Batch parsing completed:")
    logger.info(f"   ✅ Successful: {success_count}/{total_count} ({success_rate:.1f}%)")
    logger.info(f"   ❌ Failed: {failed_count}")
    
    return parsed_articles

def test_parsing_functionality():
    """
    Test function for development and deployment verification.
    
    This function tests the parsing functionality with known URLs
    and is useful for verifying deployment health.
    """
    
    logger.info("🧪 Starting parsing functionality test...")
    
    # Test URLs (use reliable news sites)
    test_urls = [
        "https://www.bbc.com/news",
        "https://edition.cnn.com/",
        "https://www.reuters.com/"
    ]
    
    success_count = 0
    
    for i, url in enumerate(test_urls[:1], 1):  # Test only first URL to avoid rate limiting
        logger.info(f"🔗 Test {i}: Parsing {urlparse(url).netloc}")
        
        try:
            result = parse_article_with_two_tier_fallback(url)
            
            if result and result.get('text'):
                success_count += 1
                logger.info(f"✅ Test {i} passed: {len(result['text'])} chars extracted")
            else:
                logger.warning(f"⚠️  Test {i} failed: No content extracted")
                
        except Exception as e:
            logger.error(f"❌ Test {i} error: {str(e)}")
    
    success_rate = (success_count / 1) * 100  # Only testing 1 URL
    logger.info(f"🏁 Parsing test completed: {success_count}/1 tests passed ({success_rate:.1f}%)")
    
    return success_count > 0

if __name__ == "__main__":
    """
    Direct execution for testing and development.
    """
    print("🧪 Running Content Scraper Tests...")
    
    # Run parsing functionality tests
    success = test_parsing_functionality()
    
    if success:
        print("✅ Parsing tests passed! Content scraper is ready for production.")
    else:
        print("❌ Parsing tests failed. Check logs for details.")