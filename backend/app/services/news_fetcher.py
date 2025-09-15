import requests
import os
from dotenv import load_dotenv
from newspaper import Article
import time

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
        'country': 'us',
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
                first_article = articles[1]
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

def parse_article_content(url):
    """Parse full article content from URL using newspaper3k"""
    try:
        print(f"📰 Parsing article from: {url}")
        
        # Create Article object
        article = Article(url)
        
        # Download and parse the article
        article.download()
        article.parse()
        
        # Extract content
        content = {
            'title': article.title,
            'text': article.text,
            'authors': article.authors,
            'publish_date': article.publish_date,
            'top_image': article.top_image,
            'summary': article.summary if hasattr(article, 'summary') else None
        }
        
        print(f"✅ Successfully parsed article: {article.title[:50]}...")
        return content
        
    except Exception as e:
        print(f"❌ Error parsing article: {e}")
        return None

def test_gnews_with_full_content():
    """Test GNews API and parse full content from articles"""
    
    # First get articles from GNews
    articles = test_gnews_api()
    
    if not articles:
        print("No articles to parse")
        return
    
    print("\n" + "="*50)
    print("PARSING FULL CONTENT")
    print("="*50)
    
    # Parse full content from first few articles
    for i, article in enumerate(articles[:2]):  # Parse first 2 articles
        url = article.get('url', '')
        if url:
            print(f"\n--- Article {i+1} ---")
            full_content = parse_article_content(url)
            
            if full_content:
                print(f"Title: {full_content['title']}")
                # print(f"Authors: {', '.join(full_content['authors']) if full_content['authors'] else 'N/A'}")
                # print(f"Publish Date: {full_content['publish_date']}")
                print(f"Full Text: {full_content['text'][:]}...")
                # print(f"Top Image: {full_content['top_image']}")
            
            # Add delay to be respectful to websites
            time.sleep(2)

if __name__ == "__main__":
    # test_gnews_api()  # Original function
    test_gnews_with_full_content()  # New function with full content parsing
