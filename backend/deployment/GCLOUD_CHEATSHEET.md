# 🚀 gcloud CLI Cheatsheet for News Pipeline

Quick reference for common deployment and management commands.

**⚠️ Note:** Replace these placeholders in all commands:
- `YOUR-REGION` → Your chosen region (e.g., `us-central1`, `asia-south1`)
- `YOUR-PROJECT-ID` → Your GCP project ID
- `SECRET_NAME` → Name of your secret
- `SERVICE_URL` → Your Cloud Run service URL

---

## 🔧 Initial Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set active project
gcloud config set project PROJECT_ID

# Set default region (choose your preferred region)
gcloud config set run/region YOUR-REGION  # e.g., us-central1, asia-south1, europe-west1

# View current configuration
gcloud config list
```

---

## 📦 Enable APIs (One-time)

```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudscheduler.googleapis.com
```

---

## 🗂️ Artifact Registry

```bash
# Create repository (one-time) - use YOUR region
gcloud artifacts repositories create news-pipeline \
    --repository-format=docker \
    --location=YOUR-REGION \
    --description="News pipeline Docker images"

# List repositories
gcloud artifacts repositories list

# List images in repository
gcloud artifacts docker images list \
    us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline

# Delete old images
gcloud artifacts docker images delete \
    us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:TAG
```

---

## 🔐 Secret Manager

### Create Secrets
```bash
# Create from stdin
echo -n "YOUR_VALUE" | gcloud secrets create SECRET_NAME --data-file=-

# Create from file
gcloud secrets create SECRET_NAME --data-file=path/to/secret.txt

# Update existing secret
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Manage Secrets
```bash
# List all secrets
gcloud secrets list

# View secret versions
gcloud secrets versions list SECRET_NAME

# Access secret value
gcloud secrets versions access latest --secret=SECRET_NAME

# Delete secret
gcloud secrets delete SECRET_NAME
```

### Grant Access
```bash
# Grant Cloud Run service account access to secret
gcloud secrets add-iam-policy-binding SECRET_NAME \
    --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
```

---

## 🐳 Build & Deploy

### Build Docker Image
```bash
# Build and push to Artifact Registry
cd backend
gcloud builds submit \
    --tag us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest \
    -f deployment/Dockerfile .

# Build with specific tag
gcloud builds submit \
    --tag us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:v1.2.3 \
    -f deployment/Dockerfile .
```

### Deploy to Cloud Run
```bash
# Full deployment command
gcloud run deploy news-pipeline \
    --image us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest \
    --platform managed \
    --region us-central1 \
    --timeout 3600 \
    --memory 12Gi \
    --cpu 4 \
    --max-instances 1 \
    --set-env-vars LOG_LEVEL=INFO,PARALLEL_SUMMARIZER_WORKERS=4,PARALLEL_CATEGORIZER_WORKERS=4 \
    --set-secrets GNEWS_API_KEY=gnews-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest \
    --no-allow-unauthenticated

# Quick redeploy with new image
gcloud run deploy news-pipeline \
    --image us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest \
    --region us-central1

# Update environment variables only
gcloud run services update news-pipeline \
    --update-env-vars PARALLEL_SUMMARIZER_WORKERS=2 \
    --region us-central1
```

---

## 📊 Cloud Run Management

### Service Info
```bash
# List services
gcloud run services list

# Describe service
gcloud run services describe news-pipeline --region us-central1

# Get service URL
gcloud run services describe news-pipeline \
    --region us-central1 \
    --format="value(status.url)"

# View revisions
gcloud run revisions list --service news-pipeline --region us-central1
```

### Invoke Service
```bash
# Invoke authenticated service
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
    https://news-pipeline-HASH-uc.a.run.app

# Proxy to localhost (for testing)
gcloud run services proxy news-pipeline --region us-central1
```

### Update Service
```bash
# Scale to zero (pause)
gcloud run services update news-pipeline \
    --max-instances 0 \
    --region us-central1

# Resume (scale to 1)
gcloud run services update news-pipeline \
    --max-instances 1 \
    --region us-central1

# Change memory/CPU
gcloud run services update news-pipeline \
    --memory 8Gi \
    --cpu 2 \
    --region us-central1

# Change timeout
gcloud run services update news-pipeline \
    --timeout 1800 \
    --region us-central1
```

### Delete Service
```bash
# Delete service
gcloud run services delete news-pipeline --region us-central1
```

---

## 📝 Logs & Monitoring

### View Logs
```bash
# Stream real-time logs
gcloud run services logs tail news-pipeline --region us-central1

# View recent logs (last 100)
gcloud run services logs read news-pipeline \
    --region us-central1 \
    --limit 100

# Filter by severity
gcloud run services logs read news-pipeline \
    --region us-central1 \
    --log-filter="severity>=ERROR"

# Search logs
gcloud run services logs read news-pipeline \
    --region us-central1 \
    --log-filter="textPayload:summarization"
```

### Metrics
```bash
# View service metrics (opens in browser)
gcloud run services describe news-pipeline \
    --region us-central1 \
    --format="value(status.url)" | xargs -I {} open "https://console.cloud.google.com/run/detail/us-central1/news-pipeline/metrics"
```

---

## ⏰ Cloud Scheduler

### Create Scheduler Job
```bash
# Create service account
gcloud iam service-accounts create news-pipeline-scheduler \
    --display-name "News Pipeline Scheduler"

# Grant run.invoker role
gcloud run services add-iam-policy-binding news-pipeline \
    --region us-central1 \
    --member serviceAccount:news-pipeline-scheduler@PROJECT_ID.iam.gserviceaccount.com \
    --role roles/run.invoker

# Create daily job (8 AM UTC)
gcloud scheduler jobs create http news-pipeline-daily \
    --location us-central1 \
    --schedule "0 8 * * *" \
    --time-zone "UTC" \
    --uri "$(gcloud run services describe news-pipeline --region us-central1 --format='value(status.url)')" \
    --http-method POST \
    --oidc-service-account-email news-pipeline-scheduler@PROJECT_ID.iam.gserviceaccount.com
```

### Manage Jobs
```bash
# List jobs
gcloud scheduler jobs list --location us-central1

# Describe job
gcloud scheduler jobs describe news-pipeline-daily --location us-central1

# Run job now (manual trigger)
gcloud scheduler jobs run news-pipeline-daily --location us-central1

# Pause job
gcloud scheduler jobs pause news-pipeline-daily --location us-central1

# Resume job
gcloud scheduler jobs resume news-pipeline-daily --location us-central1

# Update schedule
gcloud scheduler jobs update http news-pipeline-daily \
    --location us-central1 \
    --schedule "0 6 * * *"

# Delete job
gcloud scheduler jobs delete news-pipeline-daily --location us-central1
```

---

## 🛠️ IAM & Permissions

### Service Accounts
```bash
# List service accounts
gcloud iam service-accounts list

# Create service account
gcloud iam service-accounts create SERVICE_ACCOUNT_NAME \
    --display-name "Display Name"

# Grant role to service account
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
    --role=ROLE_NAME
```

### Common Roles
```bash
# Cloud Run Invoker
roles/run.invoker

# Secret Manager Accessor
roles/secretmanager.secretAccessor

# Cloud Run Admin
roles/run.admin

# Artifact Registry Reader
roles/artifactregistry.reader
```

---

## 💰 Cost & Billing

```bash
# View billing account
gcloud billing accounts list

# Link billing to project
gcloud billing projects link PROJECT_ID \
    --billing-account BILLING_ACCOUNT_ID

# View current month usage (opens browser)
gcloud alpha billing accounts describe BILLING_ACCOUNT_ID
```

---

## 🔍 Troubleshooting

### Check Service Status
```bash
# Get service status
gcloud run services describe news-pipeline \
    --region us-central1 \
    --format="value(status.conditions)"

# Check for errors
gcloud run services logs read news-pipeline \
    --region us-central1 \
    --log-filter="severity>=ERROR" \
    --limit 50
```

### Test Build Locally
```bash
# Build locally without pushing
cd backend
docker build -f deployment/Dockerfile -t news-pipeline-test .

# Run locally
docker run --rm -it \
    -e GNEWS_API_KEY="your_key" \
    -e SUPABASE_URL="your_url" \
    -e SUPABASE_SERVICE_KEY="your_key" \
    news-pipeline-test
```

### Check Quotas
```bash
# View quota usage
gcloud compute project-info describe --project PROJECT_ID
```

---

## 🔄 Common Workflows

### Full Deployment (Fresh Start)
```bash
# 1. Enable APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# 2. Create Artifact Registry
gcloud artifacts repositories create news-pipeline \
    --repository-format=docker --location=us-central1

# 3. Store secrets
echo -n "KEY" | gcloud secrets create gnews-api-key --data-file=-
echo -n "URL" | gcloud secrets create supabase-url --data-file=-
echo -n "KEY" | gcloud secrets create supabase-service-key --data-file=-

# 4. Build and deploy
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest -f deployment/Dockerfile .
gcloud run deploy news-pipeline \
    --image us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest \
    --memory 12Gi --cpu 4 --timeout 3600 --region us-central1 \
    --set-env-vars LOG_LEVEL=INFO,PARALLEL_SUMMARIZER_WORKERS=4,PARALLEL_CATEGORIZER_WORKERS=4 \
    --set-secrets GNEWS_API_KEY=gnews-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest \
    --no-allow-unauthenticated
```

### Quick Update (Code Changes)
```bash
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest -f deployment/Dockerfile .
gcloud run deploy news-pipeline --image us-central1-docker.pkg.dev/PROJECT_ID/news-pipeline/news-pipeline:latest --region us-central1
```

### Emergency Rollback
```bash
# List revisions
gcloud run revisions list --service news-pipeline --region us-central1

# Rollback to previous revision
gcloud run services update-traffic news-pipeline \
    --to-revisions REVISION_NAME=100 \
    --region us-central1
```

---

## 📚 Additional Resources

- [Cloud Run CLI Reference](https://cloud.google.com/sdk/gcloud/reference/run)
- [Secret Manager CLI](https://cloud.google.com/sdk/gcloud/reference/secrets)
- [Cloud Scheduler CLI](https://cloud.google.com/sdk/gcloud/reference/scheduler)
- [Artifact Registry CLI](https://cloud.google.com/sdk/gcloud/reference/artifacts)

---

**Pro Tip:** Set aliases in your shell profile for frequently used commands:
```bash
alias gcd="gcloud config set project"
alias gcl="gcloud run services logs tail news-pipeline --region us-central1"
alias gcs="gcloud run services describe news-pipeline --region us-central1"
```
