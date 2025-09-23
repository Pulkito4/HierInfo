# News Processing Pipeline - Deployment Guide

## 🚀 Production-Ready Structure Overview

Your news processing pipeline has been restructured for production deployment with the following improvements:

### 📁 New Structure
```
backend/
├── main_functional.py              # 🎯 Main entry point for cron jobs
├── src/                            # Production modules
│   ├── api_clients/
│   │   ├── news_fetcher.py         # GNews API with retry logic
│   │   └── content_scraper.py      # Two-tier parsing system
│   ├── processing/
│   │   └── dataframe_processor.py  # DataFrame operations
│   └── db/                         # Ready for database integration
├── utils/
│   └── logging_config.py           # Production logging
├── deployment/                     # Deployment configurations
│   ├── Dockerfile                  # Container configuration
│   ├── requirements.txt            # Production dependencies
│   ├── render.yaml                 # Render deployment
│   └── cloudrun.yaml               # Google Cloud Run config
└── logs/                           # Pipeline execution logs
```

## 🧪 Testing the New Structure

### Local Testing
```bash
# 1. Navigate to backend directory
cd /Users/tanishkagoel/Desktop/HierInfo/backend

# 2. Test the production pipeline
python main_functional.py --test

# 3. Run with more articles
python main_functional.py --articles 10
```

### Environment Setup
Make sure your `.env` file is in the backend directory with:
```
GNEWS_API_KEY=your_api_key_here
```

## 🎯 Key Features Added

### 1. **Production Logging**
- Daily log files in `/logs` directory
- Structured logging with timestamps
- Error tracking and debugging info

### 2. **Scalable Architecture**
- Concurrent article parsing for better performance
- Memory-efficient DataFrame operations
- Retry logic for API failures

### 3. **Deployment Ready**
- Docker containerization
- Cloud Run and Render configurations
- Health checks and monitoring

### 4. **Error Handling**
- Graceful failure handling
- Comprehensive error logging
- Environment validation

## 🚀 Deployment Options

### Option 1: Render (Recommended for simplicity)
1. Push code to GitHub
2. Connect Render to your repository
3. Use the `render.yaml` configuration
4. Set `GNEWS_API_KEY` in Render dashboard

### Option 2: Google Cloud Run
1. Build Docker image: `docker build -f deployment/Dockerfile -t news-pipeline .`
2. Push to Google Container Registry
3. Deploy using `cloudrun.yaml`
4. Set up Cloud Scheduler for cron jobs

### Option 3: Local Cron Job
```bash
# Add to crontab for daily execution at 8 AM
0 8 * * * cd /path/to/backend && python main_functional.py --articles 100
```

## 📊 Pipeline Flow

1. **Fetch**: Get articles from GNews API with retry logic
2. **Parse**: Extract content using newspaper3k + Playwright fallback
3. **Structure**: Create DataFrame for in-memory preprocessing
4. **Clean**: Filter and validate data for NLP processing
5. **Ready**: DataFrame ready for summarization, categorization, embeddings

## 🔧 Configuration Options

### Command Line Arguments
```bash
python main_functional.py --articles 50    # Process 50 articles
python main_functional.py --test           # Test mode (5 articles)
python main_functional.py --no-batch       # Disable concurrent parsing
```

### Environment Variables
- `LOG_LEVEL`: Set to DEBUG, INFO, WARNING, or ERROR
- `GNEWS_API_KEY`: Your GNews API key

## 📈 Monitoring & Logs

- Logs are written to `logs/pipeline_YYYYMMDD.log`
- Console output shows real-time progress
- Comprehensive error tracking and debugging info

## 🔮 Next Steps

1. **Test the new structure** with `python main_functional.py --test`
2. **Add NLP processing** for summarization and categorization
3. **Integrate Supabase** for data storage
4. **Deploy to your preferred platform**

The pipeline is now production-ready and optimized for your news aggregation app! 🎉