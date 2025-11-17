# 🚀 Google Cloud Run Deployment Guide

## 📖 What is Cloud Run?

Cloud Run is Google's **serverless container platform** that:
- Runs your Docker container only when needed (no 24/7 server costs)
- Auto-scales from 0 to N instances based on traffic
- **You only pay for the seconds your code actually runs**
- Perfect for scheduled jobs like our news pipeline

**Why Cloud Run for this project?**
- Our pipeline runs once daily (~15 minutes)
- Free tier: 180,000 vCPU-seconds/month (we use ~108,000)
- No server management, no VPS bills
- **Cost: $0/month** within free tier!

---

## 🗺️ About Regions

**What is a region?** A geographic location where Google runs your code (e.g., Virginia, Belgium, Mumbai).

**Choosing a region:**
- Pick one **closest to you or your users** for faster response
- Common choices:
  - `us-central1` (Iowa, USA) - default, good for North America
  - `asia-south1` (Mumbai, India) - if you're in India
  - `europe-west1` (Belgium) - for Europe
  - `asia-southeast1` (Singapore) - for Southeast Asia
- [Full region list](https://cloud.google.com/run/docs/locations)

**Important:** Once you pick a region, use it consistently in ALL commands below.

---

## 📋 Prerequisites

You need:

1. **Google Account** (Gmail account)
2. **Credit/debit card** (for Google Cloud billing - you won't be charged if you stay in free tier)
3. **Your API keys ready:**
   - GNews API key
   - Supabase URL and Service Key
4. **~20 minutes** to complete setup

---

## 🎯 Overview: What We'll Do

Here's the deployment process in plain English:

1. **Install gcloud CLI** → command-line tool to control Google Cloud
2. **Create a Google Cloud project** → like a folder that holds all your cloud resources
3. **Enable APIs** → turn on the services we need (Cloud Run, Artifact Registry, etc.)
4. **Store your secrets** → save API keys securely in Google's Secret Manager
5. **Build Docker image** → package your code + models into a container
6. **Deploy to Cloud Run** → upload container and configure it to run
7. **(Optional) Schedule daily runs** → set up automatic daily execution

**Total time:** ~20-30 minutes for first deployment, ~5 minutes for updates.

---

## 📦 Step-by-Step Deployment

### **Step 1: Install gcloud CLI**

**What it does:** Installs the command-line tool to interact with Google Cloud from your terminal.

**Windows (PowerShell):**
```powershell
# Download installer
Invoke-WebRequest -Uri https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe -OutFile GoogleCloudSDKInstaller.exe

# Run installer (GUI will open - follow the wizard)
.\GoogleCloudSDKInstaller.exe

# After installation, restart PowerShell and run:
gcloud init
```

**What `gcloud init` does:**
- Opens browser to log in with your Google account
- Asks you to create or select a project
- Sets up default configurations

**Verify installation:**
```powershell
gcloud --version
```
You should see version info (e.g., `Google Cloud SDK 456.0.0`).

---

### **Step 2: Create Google Cloud Project**

**What is a project?** A container that holds all your cloud resources (containers, secrets, logs, etc.). You need one project for this pipeline.

**Option A: Create via CLI (Recommended)**
```bash
# Login first (opens browser)
gcloud auth login

# Create a NEW project
# PROJECT_ID must be globally unique and lowercase (e.g., news-pipeline-pulkit-2025)
gcloud projects create YOUR-PROJECT-ID --name="News Pipeline"

# Set it as your active project
gcloud config set project YOUR-PROJECT-ID

# Set your preferred region (CHOOSE ONE from the region list above)
gcloud config set run/region YOUR-REGION
```

**Example with actual values:**
```bash
gcloud projects create news-pipeline-pulkit-2025 --name="News Pipeline"
gcloud config set project news-pipeline-pulkit-2025
gcloud config set run/region asia-south1  # Mumbai
```

**Option B: Create via Cloud Console (GUI)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click project dropdown → "New Project"
3. Enter name (e.g., "News Pipeline")
4. Note the generated Project ID
5. Run: `gcloud config set project YOUR-PROJECT-ID`

---

### **Step 3: Enable Required Services**

**What this does:** Activates the Google Cloud services we need. Think of it like installing plugins.

```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudscheduler.googleapis.com
```

**What each service does:**
- `run.googleapis.com` → Cloud Run (runs your container)
- `artifactregistry.googleapis.com` → Storage for Docker images
- `secretmanager.googleapis.com` → Secure storage for API keys
- `cloudscheduler.googleapis.com` → Cron scheduler for daily runs

**This takes ~30 seconds.** You'll see success messages for each service.

---

### **Step 4: Store Secrets in Secret Manager**

**What this does:** Saves your API keys securely in Google's encrypted Secret Manager (instead of hardcoding them in code).

**Why?** Secrets in code are:
- Visible in git history
- Exposed if you share code
- A security risk

**How to store secrets:**

```bash
# Replace YOUR_ACTUAL_KEY with your real keys!

# GNews API key
echo -n "YOUR_GNEWS_API_KEY" | gcloud secrets create gnews-api-key --data-file=-

# Supabase URL (e.g., https://xxxxx.supabase.co)
echo -n "YOUR_SUPABASE_URL" | gcloud secrets create supabase-url --data-file=-

# Supabase Service Key (the long JWT token)
echo -n "YOUR_SUPABASE_SERVICE_KEY" | gcloud secrets create supabase-service-key --data-file=-

# Optional: HuggingFace token (only needed if downloading private/gated models)
# echo -n "YOUR_HF_TOKEN" | gcloud secrets create huggingface-token --data-file=-
```

**Example with actual values:**
```bash
echo -n "abc123xyz789" | gcloud secrets create gnews-api-key --data-file=-
echo -n "https://abcdef.supabase.co" | gcloud secrets create supabase-url --data-file=-
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | gcloud secrets create supabase-service-key --data-file=-
```

**Do you need HuggingFace token?**
- ❌ **NO** if you're using public models (our current models are public)
- ✅ **YES** if you want to use gated models like Llama or if you hit rate limits

**Verify secrets were created:**
```bash
gcloud secrets list
```

You should see 3 secrets listed (or 4 if you added HF token).

**To update a secret later:**
```bash
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET-NAME --data-file=-
```

---

### **Step 5: Create Artifact Registry Repository**

**What is Artifact Registry?** A storage location for your Docker images (think of it like DockerHub, but on Google Cloud).

**Do this once:**
```bash
# Create repository (replace YOUR-REGION with your chosen region)
gcloud artifacts repositories create news-pipeline \
    --repository-format=docker \
    --location=YOUR-REGION \
    --description="News pipeline Docker images"
```

**Example:**
```bash
gcloud artifacts repositories create news-pipeline \
    --repository-format=docker \
    --location=asia-south1 \
    --description="News pipeline Docker images"
```

**This creates a "folder" to store your Docker images.**

---

### **Step 6: Build Docker Image**

**What this does:** 
1. Packages your code, dependencies, and ML models into a Docker container
2. Uploads it to Artifact Registry
3. This takes ~10-15 minutes (lots of dependencies to download)

**Navigate to backend folder:**
```bash
cd "d:\Coding stuff (self practice and projects and all)\Minor Project\backend"
```

**Build and push image:**
```bash
# Replace YOUR-REGION and YOUR-PROJECT-ID
gcloud builds submit \
    --tag YOUR-REGION-docker.pkg.dev/YOUR-PROJECT-ID/news-pipeline/news-pipeline:latest \
    -f deployment/Dockerfile .
```

**Example:**
```bash
gcloud builds submit \
    --tag asia-south1-docker.pkg.dev/news-pipeline-pulkit-2025/news-pipeline/news-pipeline:latest \
    -f deployment/Dockerfile .
```

**What happens during build:**
- ✅ Copies your code into Docker
- ✅ Installs Python packages (pandas, transformers, etc.)
- ✅ Downloads ML models (~1.2 GB)
- ✅ Uploads final image to Artifact Registry

**Watch the build logs** - you'll see each step execute. If it fails, read the error message carefully.

---

### **Step 7: Deploy Cloud Run Job**

**What this does:** Creates a Cloud Run **Job** (not a Service) that runs on-demand or via scheduler.

**What's the difference?**
- **Service** = always listening for HTTP requests (like a web server)
- **Job** = runs once when triggered, then stops (perfect for batch processing like our pipeline)

```bash
# Replace YOUR-REGION and YOUR-PROJECT-ID
gcloud run jobs create news-pipeline-job \
    --image YOUR-REGION-docker.pkg.dev/YOUR-PROJECT-ID/news-pipeline/news-pipeline:latest \
    --region YOUR-REGION \
    --task-timeout 3600 \
    --memory 12Gi \
    --cpu 4 \
    --max-retries 0 \
    --parallelism 1 \
    --set-env-vars LOG_LEVEL=INFO,PARALLEL_SUMMARIZER_WORKERS=4,PARALLEL_CATEGORIZER_WORKERS=4 \
    --set-secrets GNEWS_API_KEY=gnews-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest
```

**Example:**
```bash
gcloud run jobs create news-pipeline-job \
    --image asia-south1-docker.pkg.dev/news-pipeline-pulkit-2025/news-pipeline/news-pipeline:latest \
    --region asia-south1 \
    --task-timeout 3600 \
    --memory 12Gi \
    --cpu 4 \
    --max-retries 0 \
    --parallelism 1 \
    --set-env-vars LOG_LEVEL=INFO,PARALLEL_SUMMARIZER_WORKERS=4,PARALLEL_CATEGORIZER_WORKERS=4 \
    --set-secrets GNEWS_API_KEY=gnews-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest
```

**What each flag means:**
- `--image` → which Docker image to use
- `--task-timeout 3600` → allow up to 1 hour runtime (3600 seconds)
- `--memory 12Gi` → allocate 12 GB RAM (needed for 4 workers)
- `--cpu 4` → use 4 CPU cores (enables parallel processing)
- `--max-retries 0` → don't retry on failure (avoid duplicate processing)
- `--parallelism 1` → run 1 task at a time (don't run multiple copies)
- `--set-env-vars` → environment variables for worker count
- `--set-secrets` → inject your API keys from Secret Manager

**Optional: Add HuggingFace token (if you created it):**
Add to the `--set-secrets` flag:
```bash
--set-secrets GNEWS_API_KEY=gnews-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,HF_TOKEN=huggingface-token:latest
```

**After deployment:** You can trigger the job manually or set up a scheduler.

---

### **Step 8: Test the Job**

**How to trigger your job manually:**

```bash
# Execute the job once (replace YOUR-REGION)
gcloud run jobs execute news-pipeline-job --region YOUR-REGION
```

**What happens:**
1. Command triggers the job and returns an execution ID
2. Job starts running in the background
3. You can watch logs in real-time:
   ```bash
   gcloud run jobs executions logs tail EXECUTION-ID --region YOUR-REGION
   ```
   
**Or watch ALL job logs:**
```bash
gcloud logging tail "resource.type=cloud_run_job AND resource.labels.job_name=news-pipeline-job" --format=json
```

**What to expect in logs:**
- ✅ "Starting PARALLEL summarization with 4 workers..."
- ✅ Progress bars for each processing step
- ✅ "Pipeline completed successfully"
- ⏱️ Takes ~15-20 minutes
- ✅ Check Supabase - you should see new articles!

**Check job execution status:**
```bash
gcloud run jobs executions describe EXECUTION-ID --region YOUR-REGION
```

**If it fails:** Read the error logs carefully. Common issues:
- Wrong API keys → check Secret Manager values
- Timeout → reduce workers or increase timeout
- Out of memory → reduce workers to 2

---

### **Step 9: Set Up Daily Cron Job (Optional)**

**What this does:** Automatically triggers your Cloud Run Job every day at a specific time.

**Step 9.1: Create a service account**

**What's a service account?** A "robot user" that Cloud Scheduler uses to trigger your job securely.

```bash
gcloud iam service-accounts create news-pipeline-scheduler \
    --display-name "News Pipeline Scheduler"
```

**Step 9.2: Give it permission to invoke your Cloud Run Job**

```bash
# Replace YOUR-REGION and YOUR-PROJECT-ID
gcloud run jobs add-iam-policy-binding news-pipeline-job \
    --region YOUR-REGION \
    --member serviceAccount:news-pipeline-scheduler@YOUR-PROJECT-ID.iam.gserviceaccount.com \
    --role roles/run.invoker
```

**Step 9.3: Create the Cloud Scheduler job**

```bash
# Replace YOUR-REGION and YOUR-PROJECT-ID
# CUSTOMIZE: --schedule and --time-zone to your preference!
gcloud scheduler jobs create http news-pipeline-daily \
    --location YOUR-REGION \
    --schedule "0 8 * * *" \
    --time-zone "YOUR-TIMEZONE" \
    --uri "https://YOUR-REGION-run.googleapis.com/apis/run.googleapis.com/v2/projects/YOUR-PROJECT-ID/locations/YOUR-REGION/jobs/news-pipeline-job:run" \
    --http-method POST \
    --oauth-service-account-email news-pipeline-scheduler@YOUR-PROJECT-ID.iam.gserviceaccount.com
```

**Example (runs daily at 8 AM IST):**
```bash
gcloud scheduler jobs create http news-pipeline-daily \
    --location asia-south1 \
    --schedule "0 8 * * *" \
    --time-zone "Asia/Kolkata" \
    --uri "https://asia-south1-run.googleapis.com/apis/run.googleapis.com/v2/projects/news-pipeline-pulkit-2025/locations/asia-south1/jobs/news-pipeline-job:run" \
    --http-method POST \
    --oauth-service-account-email news-pipeline-scheduler@news-pipeline-pulkit-2025.iam.gserviceaccount.com
```

**Common schedules (cron format):**
| Schedule | Cron Expression | Meaning |
|----------|----------------|---------|
| Daily at 8 AM | `"0 8 * * *"` | Once per day at 8:00 |
| Every 6 hours | `"0 */6 * * *"` | 4 times per day |
| Daily at 8 PM | `"0 20 * * *"` | Once per day at 20:00 |
| Twice daily | `"0 8,20 * * *"` | At 8 AM and 8 PM |
| Weekly on Sunday | `"0 0 * * 0"` | Sundays at midnight |

**Common timezones:**
- `UTC` (default, no daylight saving)
- `Asia/Kolkata` (India - IST)
- `America/New_York` (US East Coast - EST/EDT)
- `Europe/London` (UK - GMT/BST)
- `Asia/Singapore` (Singapore - SGT)
- [Full timezone list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

**Test the scheduler immediately:**
```bash
gcloud scheduler jobs run news-pipeline-daily --location YOUR-REGION
```

**View scheduler logs:**
```bash
gcloud scheduler jobs describe news-pipeline-daily --location YOUR-REGION
```

---

## 💰 Cost Breakdown

### **With Parallelization (4 workers, 15 min runtime):**

```
Configuration:
- vCPU: 4 cores
- Memory: 12 GB
- Runtime: 15 minutes/day

Monthly usage:
- vCPU: 4 × 900s × 30 = 108,000 vCPU-seconds
- Memory: 12 GB × 900s × 30 = 324,000 GiB-seconds

Free tier limits:
- vCPU: 180,000 seconds/month ✅
- Memory: 360,000 GiB-seconds/month ✅

Cost: $0.00/month (COMPLETELY FREE!)
```

**If you exceed free tier:**
- Overage cost: ~$0.30-0.50/month
- Still 90% cheaper than a VPS!

---

## 🔧 Configuration Options

### **Environment Variables (in deployment command):**

```bash
# Adjust worker count (2-4 recommended)
PARALLEL_SUMMARIZER_WORKERS=4
PARALLEL_CATEGORIZER_WORKERS=4

# Adjust logging
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR

# Pipeline settings (optional)
GNEWS_FETCH_MODE=prod  # Options: prod, test
PIPELINE_TIMEZONE=Asia/Kolkata  # Your timezone
```

### **Resource Sizing:**

| Workers | vCPU | Memory | Runtime | Cost |
|---------|------|--------|---------|------|
| 1 (sequential) | 1 | 4 GB | 2h+ | ❌ Timeout |
| 2 | 2 | 6 GB | ~40 min | ~$0.20/month |
| 4 (recommended) | 4 | 12 GB | ~15 min | **FREE** |

---

## 📊 Monitoring & Logs

### **View Job Logs (CLI):**
```bash
# View logs for ALL job executions
gcloud logging tail "resource.type=cloud_run_job AND resource.labels.job_name=news-pipeline-job" --format=json

# View logs for a specific execution (replace EXECUTION-ID)
gcloud run jobs executions logs tail EXECUTION-ID --region YOUR-REGION

# List recent job executions
gcloud run jobs executions list --job news-pipeline-job --region YOUR-REGION

# Filter errors only
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=news-pipeline-job AND severity>=ERROR" --limit 50
```

### **View Logs (Cloud Console - GUI):**
1. Go to [console.cloud.google.com/run/jobs](https://console.cloud.google.com/run/jobs)
2. Click `news-pipeline-job`
3. Click **EXECUTIONS** tab to see all runs
4. Click any execution to see its logs
5. You can filter by severity, search text, etc.

### **Job Status:**
```bash
# Check if job is configured correctly
gcloud run jobs describe news-pipeline-job --region YOUR-REGION

# View execution history
gcloud run jobs executions list --job news-pipeline-job --region YOUR-REGION --limit 10
```

### **Check Costs:**
1. Go to [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. View current month usage
3. Should show $0 if within free tier
4. Look for "Cloud Run" in the breakdown

---

## 🐛 Troubleshooting

### **Problem: Build fails**

**What to check:**
```bash
# Test Docker build locally first
cd "d:\Coding stuff (self practice and projects and all)\Minor Project\backend"
docker build -f deployment/Dockerfile -t news-pipeline-test .
```

**Common build errors:**
- `requirements.lock not found` → Make sure you're in the `backend` folder
- `COPY failed` → Check that `src/`, `utils/`, `main.py` exist
- `pip install fails` → One of the packages might be incompatible

### **Problem: Deployment succeeds but container crashes**

**Check logs:**
```bash
gcloud run services logs read news-pipeline --region YOUR-REGION --limit 50
```

**Common runtime errors:**
| Error Message | Cause | Fix |
|--------------|-------|-----|
| `ModuleNotFoundError` | Missing package | Add to `requirements.lock` |
| `KeyError: 'GNEWS_API_KEY'` | Secret not injected | Check Secret Manager and `--set-secrets` flag |
| `Memory allocation failed` | Out of RAM | Reduce workers to 2 or increase memory |
| `Deadline exceeded` | Timeout (>1 hour) | Reduce workers or split pipeline |

### **Problem: Pipeline runs but no articles appear**

**Check:**
1. Supabase connection: verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. GNews API: verify `GNEWS_API_KEY` is valid
3. Look for errors in logs: `gcloud run services logs tail news-pipeline --region YOUR-REGION`

### **Problem: Costs are higher than expected**

**Check usage:**
```bash
# View service details
gcloud run services describe news-pipeline --region YOUR-REGION
```

**Reduce costs:**
- Reduce workers: `--update-env-vars PARALLEL_SUMMARIZER_WORKERS=2`
- Use less memory: `--memory 8Gi`
- Reduce frequency: change scheduler to every 2 days

---

## 🎉 Success Checklist

After deployment, verify:
- ✅ Service shows "READY" in Cloud Run console
- ✅ Logs show "Starting PARALLEL summarization..."
- ✅ Pipeline completes in ~15-20 minutes
- ✅ Articles appear in Supabase
- ✅ No error messages in logs
- ✅ Monthly cost is $0 (within free tier)

---

## 🔄 Updating the Deployment

**When you change code and want to redeploy:**

```bash
cd "d:\Coding stuff (self practice and projects and all)\Minor Project\backend"

# Step 1: Rebuild image (this takes ~10-15 min)
gcloud builds submit \
    --tag YOUR-REGION-docker.pkg.dev/YOUR-PROJECT-ID/news-pipeline/news-pipeline:latest \
    -f deployment/Dockerfile .

# Step 2: Update the Job to use new image (this is fast)
gcloud run jobs update news-pipeline-job \
    --image YOUR-REGION-docker.pkg.dev/YOUR-PROJECT-ID/news-pipeline/news-pipeline:latest \
    --region YOUR-REGION
```

**To update only environment variables (no rebuild needed):**
```bash
gcloud run jobs update news-pipeline-job \
    --update-env-vars PARALLEL_SUMMARIZER_WORKERS=2 \
    --region YOUR-REGION
```

**To update secrets:**
```bash
# First update the secret value in Secret Manager
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET-NAME --data-file=-

# Job will automatically use latest version on next run
```

---

## 📞 Support

**Common Questions:**
- **Q: Can I use GPU?** A: Cloud Run doesn't support GPU. Use Compute Engine + GPU if needed.
- **Q: Can I run more frequently?** A: Yes, adjust Cloud Scheduler cron expression.
- **Q: Can I process more articles?** A: Yes, but watch memory usage and timeouts.

**Resources:**
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Guide](https://cloud.google.com/secret-manager/docs)
- [Cloud Scheduler Docs](https://cloud.google.com/scheduler/docs)
