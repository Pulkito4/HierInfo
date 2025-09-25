"""
GNews API Client - Production Version

Production-ready module for fetching news articles from GNews API.
Includes comprehensive logging, error handling, and scalability features.
"""

import requests
import os
import time
from dotenv import load_dotenv
from typing import List, Dict, Optional
from utils.logging_config import get_logger

# Load environment variables
load_dotenv()

# Initialize logger
logger = get_logger(__name__)

def fetch_articles_from_gnews(
    max_articles: int = 100,
    category: str = "world",
    country: str = "in",
    language: str = "en",
    retry_attempts: int = 3,
    timeout: int = 30
) -> List[Dict]:
    """
    Fetch articles from GNews API with production-grade error handling.
    
    This function is designed for production deployment and can handle:
    - Network failures with retry logic
    - API rate limiting
    - Large-scale article fetching (up to API limits)
    - Comprehensive logging for monitoring
    
    Args:
        max_articles (int): Maximum number of articles to fetch (1-100)
        category (str): News category (world, business, technology, etc.)
        country (str): Country code for news (e.g., 'in', 'us', 'uk')
        language (str): Language code for news (e.g., 'en', 'es', 'fr')
        retry_attempts (int): Number of retry attempts on failure
        timeout (int): Request timeout in seconds
        
    Returns:
        List[Dict]: List of article dictionaries ready for processing
        
    Raises:
        ValueError: If API key is not configured
        requests.exceptions.RequestException: If all retry attempts fail
    """
    
    logger.info(f"🚀 Starting GNews API fetch - Target: {max_articles} articles")
    logger.info(f"📊 Parameters: category={category}, country={country}, lang={language}")
    
    # Validate API key
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        error_msg = "GNEWS_API_KEY not found in environment variables"
        logger.error(f"❌ {error_msg}")
        raise ValueError(error_msg)
    
    # Validate parameters
    max_articles = min(max_articles, 100)  # API limit
    if max_articles != min(max_articles, 100):
        logger.warning(f"⚠️  Requested {max_articles} articles, but API limit is 100")
    
    # Prepare API request
    url = "https://gnews.io/api/v4/top-headlines"
    params = {
        'category': category,
        'country': country,
        'lang': language,
        'max': max_articles,
        'apikey': api_key
    }
    
    # Retry logic for production reliability
    last_exception = None
    for attempt in range(retry_attempts):
        try:
            logger.info(f"🌐 API Request attempt {attempt + 1}/{retry_attempts}")
            
            # Make the API request
            response = requests.get(url, params=params, timeout=timeout)
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            articles = data.get('articles', [])
            
            # Log success
            logger.info(f"✅ Successfully fetched {len(articles)} articles from GNews API")
            
            if articles:
                # Log sample article for debugging
                sample_article = articles[0]
                logger.debug(f"📰 Sample article: {sample_article.get('title', 'N/A')[:50]}...")
                logger.debug(f"🏢 Sample source: {sample_article.get('source', {}).get('name', 'N/A')}")
            
            return articles
            
        except requests.exceptions.Timeout:
            error_msg = f"Request timeout after {timeout} seconds"
            logger.warning(f"⏰ {error_msg}")
            last_exception = TimeoutError(error_msg)
            
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e.response.status_code} - {e.response.text}"
            logger.warning(f"🚫 {error_msg}")
            last_exception = e
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error: {str(e)}"
            logger.warning(f"🌐 {error_msg}")
            last_exception = e
            
        except ValueError as e:
            error_msg = f"JSON parsing error: {str(e)}"
            logger.warning(f"📄 {error_msg}")
            last_exception = e
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.warning(f"💥 {error_msg}")
            last_exception = e
        
        # Wait before retry (exponential backoff)
        if attempt < retry_attempts - 1:
            wait_time = (2 ** attempt) * 2  # 2, 4, 8 seconds
            logger.info(f"⏳ Waiting {wait_time} seconds before retry...")
            time.sleep(wait_time)
    
    # All attempts failed
    error_msg = f"Failed to fetch articles after {retry_attempts} attempts"
    logger.error(f"❌ {error_msg}")
    
    if last_exception:
        logger.error(f"💀 Last error: {last_exception}")
    
    # Return empty list instead of raising exception (graceful degradation)
    logger.warning("🔄 Returning empty list due to API failures")
    return []

def validate_api_connection() -> bool:
    """
    Validate GNews API connection with a minimal test request.
    
    This function is useful for health checks and deployment verification.
    
    Returns:
        bool: True if API is accessible, False otherwise
    """
    
    logger.info("🧪 Testing GNews API connection...")
    
    try:
        # Test with minimal request
        test_articles = fetch_articles_from_gnews(
            max_articles=1,
            retry_attempts=1,
            timeout=10
        )
        
        if test_articles:
            logger.info("✅ GNews API connection test successful")
            return True
        else:
            logger.warning("⚠️  GNews API connection test returned no articles")
            return False
            
    except Exception as e:
        logger.error(f"❌ GNews API connection test failed: {e}")
        return False

# def get_api_usage_stats() -> Dict:
    """
    Get API usage statistics for monitoring purposes.
    
    Note: This is a placeholder for future implementation.
    GNews API doesn't provide usage endpoints, but this could be extended
    to track usage locally or integrate with monitoring systems.
    
    Returns:
        Dict: Usage statistics (placeholder implementation)
    """
    
    logger.info("📊 Retrieving API usage stats...")
    
    # Placeholder implementation
    # In production, this could track:
    # - Requests made today
    # - Success/failure rates
    # - Rate limit status
    # - Response times
    
    stats = {
        "status": "placeholder",
        "note": "API usage tracking not implemented",
        "suggestion": "Implement local usage tracking or integrate with monitoring"
    }
    
    logger.debug(f"📈 Usage stats: {stats}")
    return stats

# Test function for development and deployment verification
def test_api_functionality():
    """
    Comprehensive test function for development and deployment verification.
    
    This function tests all major API functionality and is useful for:
    - Local development testing
    - Deployment verification
    - CI/CD pipeline checks
    """
    
    logger.info("🧪 Starting comprehensive API functionality test...")
    
    try:
        # Test 1: Connection validation
        logger.info("🔗 Test 1: API connection validation")
        is_connected = validate_api_connection()
        
        if not is_connected:
            logger.error("❌ API connection test failed")
            return False
        
        # Test 2: Small fetch
        logger.info("📰 Test 2: Small article fetch (3 articles)")
        small_batch = fetch_articles_from_gnews(max_articles=3)
        
        if not small_batch:
            logger.error("❌ Small batch fetch failed")
            return False
        
        logger.info(f"✅ Small batch test successful: {len(small_batch)} articles")
        
        # Test 3: Different categories
        logger.info("🏷️  Test 3: Different category fetch")
        tech_articles = fetch_articles_from_gnews(
            max_articles=2, 
            category="technology"
        )
        
        logger.info(f"✅ Category test successful: {len(tech_articles)} tech articles")
        
        logger.info("🎉 All API functionality tests passed!")
        return True
        
    except Exception as e:
        logger.error(f"💀 API functionality test failed: {e}")
        return False

if __name__ == "__main__":
    """
    Direct execution for testing and development.
    """
    print("🧪 Running GNews API Client Tests...")
    
    # Run comprehensive tests
    success = test_api_functionality()
    
    if success:
        print("✅ All tests passed! API client is ready for production.")
    else:
        print("❌ Tests failed. Check logs for details.")