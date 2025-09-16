# Deployment Instructions

## Overview
This news processing pipeline can be deployed as a scheduled cron job on various platforms. The pipeline fetches, processes, and stores news articles automatically.

## Deployment Options

### 1. Render.com (Recommended for Simplicity)

1. **Prepare the repository:**
   ```bash
   git add .
   git commit -m "Add news processing pipeline"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [Render.com](https://render.com)
   - Create new "Cron Job" service
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `python main.py`
   - Set schedule: `0 6 * * *` (daily at 6 AM UTC)
   
3. **Environment Variables (set in Render dashboard):**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   GNEWS_API_KEY=your_gnews_api_key
   PYTHONPATH=/opt/render/project/src
   FETCH_LIMIT=1000
   ```

### 2. Google Cloud Run + Cloud Scheduler (More Powerful)

1. **Prerequisites:**
   - Google Cloud Project with billing enabled
   - Docker installed locally
   - gcloud CLI installed and configured

2. **Build and push Docker image:**
   ```bash
   # Build the image
   docker build -f deployment/Dockerfile -t news-pipeline .
   
   # Tag for Google Container Registry
   docker tag news-pipeline gcr.io/YOUR_PROJECT_ID/news-pipeline
   
   # Push to registry
   docker push gcr.io/YOUR_PROJECT_ID/news-pipeline
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy news-pipeline \
     --image gcr.io/YOUR_PROJECT_ID/news-pipeline \
     --platform managed \
     --region us-central1 \
     --memory 2Gi \
     --cpu 1 \
     --timeout 1800 \
     --max-instances 1 \
     --no-allow-unauthenticated
   ```

4. **Set up Cloud Scheduler:**
   ```bash
   gcloud scheduler jobs create http news-pipeline-daily \
     --schedule="0 6 * * *" \
     --uri="https://YOUR_CLOUD_RUN_URL" \
     --http-method=POST \
     --oidc-service-account-email=YOUR_SERVICE_ACCOUNT
   ```

5. **Environment Variables:**
   Set secrets in Google Secret Manager and reference them in the deployment.

### 3. Local Development/Testing

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export SUPABASE_URL="your_url"
   export SUPABASE_SERVICE_KEY="your_key"
   export GNEWS_API_KEY="your_key"
   ```

3. **Run pipeline:**
   ```bash
   python main.py
   ```

4. **Run with scheduler (for testing):**
   ```bash
   python deployment/cron_schedule.py
   ```

## Configuration

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (with full permissions)
- `GNEWS_API_KEY`: GNews.io API key
- `FETCH_LIMIT`: Maximum articles to fetch per run (default: 1000)
- `RUN_ON_STARTUP`: Whether to run immediately on startup (default: true)
- `DEBUG`: Enable debug logging (default: false)

### Pipeline Configuration
You can modify the pipeline behavior by editing `main.py`:
- Change categories to fetch
- Adjust processing parameters
- Modify clustering settings
- Update NLP model configurations

## Monitoring

### Logs
- Logs are written to `logs/pipeline_YYYYMMDD.log`
- Console output includes structured logging
- Pipeline execution logs are stored in database

### Database Monitoring
The pipeline stores execution logs in the `pipeline_logs` table:
- Execution time
- Articles processed
- Success/error status
- Detailed statistics

### Alerts (Optional)
Set up monitoring alerts for:
- Pipeline execution failures
- Long execution times (> 30 minutes)
- Low article fetch counts
- Database connection issues

## Scaling

### Performance Tuning
- Adjust `ContentScraper` max_workers (default: 5)
- Modify batch sizes for NLP processing
- Configure clustering parameters
- Tune database batch insert sizes

### Resource Requirements
- **Memory**: 2-4 GB RAM recommended
- **CPU**: 1-2 cores sufficient
- **Storage**: 1 GB for logs and model cache
- **Network**: Stable internet for API calls

## Troubleshooting

### Common Issues
1. **Memory errors**: Reduce fetch_limit or batch sizes
2. **API rate limits**: Implement longer delays between requests
3. **Model download failures**: Check internet connectivity and disk space
4. **Database connection errors**: Verify Supabase credentials and network access

### Debug Mode
Enable debug logging:
```bash
export DEBUG=true
python main.py
```

This will provide detailed logs for each pipeline step.