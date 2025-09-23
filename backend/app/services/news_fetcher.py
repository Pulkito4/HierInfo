import requests
import os
from dotenv import load_dotenv
from newspaper import Article
import time
from playwright.sync_api import sync_playwright
import random
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

def test_gnews_api():
    """Simple function to test GNews API connection"""
    
    # Get API key from environment
    api_key = os.getenv("GNEWS_API_KEY")
    
    if not api_key:
        print("Error: GNEWS_API_KEY not found in environment variables")
        return None
    
    # GNews API endpoint for top headlines
    url = "https://gnews.io/api/v4/top-headlines?category=world&apikey=" + api_key

    # Parameters for the request
    params = {
        'apikey': api_key,
        'lang': 'en',
        'country': 'in',
        'max': 5  # Get 5 articles
    }
    
    try:
        print("Testing GNews API connection...")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            
            print(f"✅ Success! Retrieved {len(articles)} articles")
            
            # Print first article as example
            if articles:
                first_article = articles[0]
                print("\nSample article:")
                print(f"Title: {first_article.get('title', 'N/A')}")
                print(f"Source: {first_article.get('source', {}).get('name', 'N/A')}")
                print(f"URL: {first_article.get('url', 'N/A')}")
                print(f"CONTENT: {first_article.get('content', 'N/A')}")
            
            return articles
            
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Error: Request timeout")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def parse_with_newspaper3k(url):
    """Primary parser - newspaper3k (fastest)"""
    try:
        print(f"📰 [Method 1] newspaper3k parsing: {url}")
        
        # Rotate user agents for better success
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        # Configure article with custom headers
        article = Article(url)
        article.config.browser_user_agent = random.choice(user_agents)
        article.config.request_timeout = 10
        
        # Download and parse
        article.download()
        article.parse()
        
        # Extract content
        content = {
            'title': article.title,
            'text': article.text,
            'authors': article.authors,
            'publish_date': article.publish_date,
            'top_image': article.top_image,
            'summary': article.summary if hasattr(article, 'summary') else None,
            'method': 'newspaper3k'
        }
        
        # Validate content quality
        if content['text'] and len(content['text']) > 100:
            print(f"✅ newspaper3k successful - {len(content['text'])} chars extracted")
            return content
        else:
            print(f"❌ newspaper3k - insufficient content ({len(content['text']) if content['text'] else 0} chars)")
            return None
        
    except Exception as e:
        print(f"❌ newspaper3k failed: {e}")
        return None

def parse_with_playwright(url):
    """Secondary parser - Playwright (most reliable, heavier)"""
    try:
        print(f"🎭 [Method 2] Playwright parsing: {url}")
        
        with sync_playwright() as p:
            # Launch browser with stealth options
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            )
            
            # Create context with realistic viewport and user agent
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Hide automation indicators
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
            """)
            
            page = context.new_page()
            
            # Set additional headers
            page.set_extra_http_headers({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            })
            
            print("🌐 Loading page with Playwright...")
            
            # Navigate to URL with timeout
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for content to load
            page.wait_for_timeout(3000)
            
            # Get page content
            html_content = page.content()
            
            # Close browser
            browser.close()
            
            print("📄 Extracting content with newspaper3k...")
            
            # Parse HTML with newspaper3k
            article = Article(url)
            article.set_html(html_content)
            article.parse()
            
            content = {
                'title': article.title,
                'text': article.text,
                'authors': article.authors,
                'publish_date': article.publish_date,
                'top_image': article.top_image,
                'summary': article.summary if hasattr(article, 'summary') else None,
                'method': 'playwright'
            }
            
            # Validate content quality
            if content['text'] and len(content['text']) > 100:
                print(f"✅ Playwright successful - {len(content['text'])} chars extracted")
                return content
            else:
                print(f"❌ Playwright - insufficient content ({len(content['text']) if content['text'] else 0} chars)")
                return None
            
    except Exception as e:
        print(f"❌ Playwright failed: {e}")
        return None

def parse_article_with_two_tier_fallback(url):
    """
    Two-tier fallback parsing strategy:
    1. newspaper3k (fastest, lightweight)
    2. Playwright (most reliable for modern sites)
    """
    
    print(f"\n🎯 Starting two-tier parsing for: {url}")
    print(f"🌐 Domain: {urlparse(url).netloc}")
    
    # Define parsing methods in order of preference
    parsing_methods = [
        ("newspaper3k", parse_with_newspaper3k),
        ("Playwright", parse_with_playwright)
    ]
    
    for i, (method_name, parser_func) in enumerate(parsing_methods, 1):
        print(f"\n🔄 Tier {i}: Trying {method_name}...")
        
        try:
            content = parser_func(url)
            
            if content and content.get('text') and len(content['text']) > 100:
                print(f"🎉 SUCCESS! {method_name} extracted {len(content['text'])} characters")
                return content
            else:
                print(f"⚠️  {method_name} returned insufficient content, trying next method...")
                
        except Exception as e:
            print(f"💥 {method_name} encountered error: {e}")
            print(f"🔄 Moving to next parsing method...")
        
        # Add delay between attempts to be respectful
        if i < len(parsing_methods):
            time.sleep(2)
    
    print("💀 Both parsing methods failed for this URL")
    return None

def test_two_tier_news_parsing():
    """Test GNews API with two-tier fallback parsing system"""
    
    print("🚀 Starting Two-Tier News Parsing System")
    print("📋 Tier 1: newspaper3k (fast)")
    print("📋 Tier 2: Playwright (reliable)")
    print("="*60)
    
    # Get articles from GNews API
    articles = test_gnews_api()
    
    if not articles:
        print("❌ No articles to parse - check GNews API")
        return
    
    print(f"\n📊 Processing {min(len(articles), 3)} articles with two-tier parsing...")
    
    successful_parses = 0
    method_stats = {'newspaper3k': 0, 'playwright': 0}
    
    # Process articles
    for i, article in enumerate(articles[:3]):
        url = article.get('url', '')
        
        if not url:
            print(f"\n❌ Article {i+1}: No URL found")
            continue
            
        print(f"\n{'='*50}")
        print(f"📰 ARTICLE {i+1}/{min(len(articles), 3)}")
        print(f"{'='*50}")
        print(f"🔗 URL: {url}")
        print(f"📝 Original Title: {article.get('title', 'N/A')}")
        print(f"🏢 Source: {article.get('source', {}).get('name', 'N/A')}")
        
        # Parse with two-tier fallback
        full_content = parse_article_with_two_tier_fallback(url)
        
        if full_content and full_content.get('text'):
            successful_parses += 1
            method_used = full_content.get('method', 'unknown')
            method_stats[method_used] = method_stats.get(method_used, 0) + 1
            
            print(f"\n🎉 PARSING SUCCESSFUL!")
            print(f"   ⚡ Method Used: {method_used}")
            print(f"   📊 Content Length: {len(full_content['text'])} characters")
            print(f"   📰 Extracted Title: {full_content['title']}")
            
            if full_content.get('authors'):
                print(f"   ✍️  Authors: {', '.join(full_content['authors'])}")
            
            if full_content.get('publish_date'):
                print(f"   📅 Published: {full_content['publish_date']}")
            
            # Show content preview
            text_preview = full_content['text'][:] + "..." if len(full_content['text']) > 400 else full_content['text']
            print(f"\n📄 Content :")
            print(f"   {text_preview}")
            
        else:
            print(f"\n💀 PARSING FAILED - All methods exhausted")
        
        # Respectful delay between articles
        if i < min(len(articles), 3) - 1:
            print(f"\n⏳ Waiting 3 seconds before next article...")
            time.sleep(3)
    
    # Final statistics
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"✅ Successfully Parsed: {successful_parses}/{min(len(articles), 3)} articles")
    print(f"📈 Success Rate: {(successful_parses/min(len(articles), 3))*100:.1f}%")
    print(f"\n🔧 Method Usage Statistics:")
    for method, count in method_stats.items():
        if count > 0:
            print(f"   {method}: {count} article(s)")
    
    if successful_parses == 0:
        print(f"\n🆘 TROUBLESHOOTING GUIDE:")
        print(f"   1. Check internet connection")
        print(f"   2. Verify GNews API key is valid")
        print(f"   3. Install missing dependencies:")
        print(f"      pip install playwright")
        print(f"      playwright install chromium")
        print(f"   4. Some sites may have very strong anti-bot protection")

if __name__ == "__main__":
    print("📦 Required packages: newspaper3k, playwright, requests, python-dotenv")
    print("🛠️  Setup command: pip install newspaper3k playwright requests python-dotenv")
    print("🎭 Playwright setup: playwright install chromium")
    print()
    
    test_two_tier_news_parsing()