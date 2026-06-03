# HierInfo: Comprehensive System Design & Architecture Review

This document serves as a deep dive into the architecture, design patterns, and engineering decisions behind the **HierInfo** project. It is intended to be a highly detailed resource for interview preparation, system design review, and scaling analysis. It not only covers *what* was built, but *why* specific choices were made, *how* they benefit the system, and *where* improvements can be made to scale up to enterprise-level workloads.

---

## 1. System Overview

HierInfo is a full-stack, AI-powered news curation platform. Its primary goal is to solve the problem of information overload in the modern news cycle by aggregating, filtering, clustering, and summarizing news from various sources into a concise, personalized feed.

The system is split into a decoupled architecture:
1. **The Backend Pipeline (Python):** A batch-processing cron job that acts as the data ingestion and machine learning engine.
2. **The Database (Supabase/PostgreSQL):** The central state store, utilizing `pgvector` for embeddings and edge functions/RPCs for materialized caching.
3. **The Frontend Application (Next.js):** The user-facing application built for high performance, utilizing aggressive client-side caching and real-time cache invalidation.

---

## 2. Backend Architecture: The Data Pipeline

The backend is located in `main.py` and structured as a modular Extract, Transform, Load (ETL) pipeline.

### 2.1. Data Ingestion & API Clients
**What we did:**
The system ingests metadata (titles, URLs) from Google News (via API) and various RSS feeds (e.g., BBC). It uses a hybrid `SOURCE_PRIORITY_MAP` to rank known VIP sources (like Reuters) and a rule-based keyword scoring system to penalize low-quality sources (like "Blogs"). 

**Why it helps:**
- **Diversity vs. Quality:** By mixing APIs (GNews for volume) and RSS (for guaranteed high-quality baseline), the pipeline ensures a diverse feed.
- **Rule-Based Scoring:** The source scoring system prevents junk domains from polluting the top of the feed without needing an exhaustive blocklist.

**How to Scale/Improve:**
- Currently, ingestion runs sequentially in batches using Python's `ThreadPoolExecutor`. To scale to thousands of feeds, this should be moved to a distributed task queue like **Celery** or **RabbitMQ** with separate worker nodes.
- We could implement an adaptive scraping schedule based on the velocity of news from specific domains (e.g., scrape CNN every 5 mins, a local blog every 6 hours).

### 2.2. Content Scraping: The Two-Tier Fallback
**What we did:**
Scraping raw HTML is notoriously difficult due to paywalls, cookie banners, and bot protections. We implemented a **Two-Tier Fallback Scraper** (`content_scraper.py`):
1. **Tier 1 (Fast):** Uses `newspaper3k`. It's lightweight and fast but struggles with client-side rendered (SPA) sites.
2. **Tier 2 (Heavy):** If Tier 1 fails or returns blocked content, it falls back to `Playwright`—a headless Chromium instance armed with anti-bot stealth options (spoofing navigators, hiding webdriver flags).

**Why it helps:**
- **Cost/Speed Optimization:** Headless browsers are extremely memory and CPU intensive. By only using Playwright when absolutely necessary, we keep pipeline runtimes and compute costs low while maintaining high extraction success rates.

**How to Scale/Improve:**
- Playwright is currently restricted by a thread semaphore (`_playwright_sema = 2`). At scale, running headless browsers on the same machine as the ML models will cause resource starvation.
- **Improvement:** Move scraping to a specialized serverless fleet (like AWS Lambda or Google Cloud Run) or use a managed proxy scraping service like BrightData/ScrapingBee.

### 2.3. The Semantic Consistency Guardrail (The "Bouncer")
**What we did:**
After scraping, the raw text is compared against the original API/RSS headline using cosine similarity on small vector embeddings (`check_title_content_alignment`). 

**Why it helps:**
- **Data Integrity:** Many sites return a generic "Please disable your adblocker" page with an HTTP 200 status. The scraper thinks it succeeded, but the content is garbage. The "Bouncer" mathematically proves the scraped text is actually about the headline. If similarity is too low, the article is dropped. This prevents hallucinated summaries downstream.

**How to Scale/Improve:**
- Currently, this uses the same embedding model used for main clustering. To save compute time on validation, we could use a blazing-fast localized model (like `MiniLM-L3`) specifically for the bouncer, or simply rely on fuzzy text matching (TF-IDF / BM25) before committing to a dense vector pass.

### 2.4. Natural Language Processing (NLP) Engine
The core intelligence of the pipeline lives in `src/processing/`.

#### A. Embeddings & Deduplication
- **Embeddings:** We generate dense vectors using `sentence-transformers` (`all-MiniLM-L6-v2`).
- **Clustering:** We use **HDBSCAN** (Density-Based Spatial Clustering).
- **Why:** In news, 50 outlets will report on the exact same event. HDBSCAN finds these dense clusters of identical stories in vector space. We then pick the single "Best Article" per cluster based on our `SOURCE_PRIORITY_MAP` and discard the rest. This creates a clean, deduplicated feed.

#### B. MapReduce Summarization
- **What:** Large articles exceed the context window (token limit) of our summarization model (`distilbart-cnn-12-6`).
- **How:** We implemented a `RecursiveCharacterTextSplitter` to chop the article into 1024-token chunks with overlap. We summarize each chunk individually (**Map**), concatenate the summaries, and summarize the result (**Reduce**).
- **Why:** Prevents token truncation errors and ensures the end of long articles isn't ignored by the LLM.

#### C. Hierarchical Zero-Shot Classification
- **What:** We use `valhalla/distilbart-mnli-12-1` to categorize articles (e.g., "Technology") and tag specific topics (e.g., "AI", "Cybersecurity").
- **Why:** By identifying the broad category first, we dynamically narrow the list of candidate topic tags. This makes the zero-shot classifier much faster and more accurate (less prompt confusion).

**How to Scale/Improve the NLP Engine:**
- Running embeddings, HDBSCAN, and DistilBART on a single machine is a bottleneck. 
- **Improvement:** Decouple the ML pipeline. Push the scraped data to Kafka/PubSub. Have dedicated GPU workers (e.g., deployed on Modal, RunPod, or AWS SageMaker) consume the stream, run the models, and write back to the DB.
- **Model Upgrades:** Swap the heavy BART models for highly quantized modern LLMs (like Llama-3-8B-Instruct via vLLM) to get better summaries and cheaper topic extraction.

---

## 3. Database Architecture (Supabase / PostgreSQL)

### 3.1. Vectorized Upserts
**What we did:**
The pipeline formats Pandas DataFrames into dictionaries and executes `.upsert()` operations on the `url` constraint.
**Why:** Idempotency. If the pipeline crashes and restarts, it won't duplicate data.

### 3.2. RPC Materialized Views
**What we did:**
At the end of a successful pipeline run, the backend triggers PostgreSQL RPC functions: `refresh_trending_cache()` and `refresh_critical_cache()`.
**Why it helps:**
- **Read-Heavy Optimization:** The frontend is read-heavy. Instead of joining the `articles`, `categories`, and `embeddings` tables and calculating trending scores on every single user request, the DB does the math *once* during the refresh and stores the result in a flattened cache table. The frontend API simply reads a pre-computed view.

---

## 4. Frontend Architecture (Next.js & React Query)

The frontend is built for immediate visual feedback and zero-layout-shift scrolling.

### 4.1. Stale-While-Revalidate Caching (React Query)
**What we did:**
The frontend utilizes `@tanstack/react-query` with extremely aggressive caching (e.g., `DIGEST_STALE_TIME` set to infinity, and `refetchOnWindowFocus` disabled).
**Why it helps:**
- When a user navigates back to their feed, it loads instantly from memory. There are no loading spinners. 

### 4.2. Push-Based Cache Invalidation (Realtime)
**What we did:**
Since the React Query cache is infinite, how does the user get new news? We use **Supabase Realtime** to subscribe to a `cache_versions` table. When the Python pipeline finishes a run, it increments the version in the database. The frontend receives this web-socket event and calls `queryClient.invalidateQueries()`, seamlessly fetching the fresh data in the background.
**Why it helps:**
- Replaces inefficient REST polling (checking the server every 30 seconds) with an event-driven architecture, drastically saving database bandwidth and frontend battery life.

### 4.3. Session-Stable Deterministic Pagination
**What we did:**
Infinite scrolling is used for the Explore feed.
- **The Problem:** If a user is on Page 2, and the backend inserts 10 new articles at the top of the database, the old articles shift down. When the user requests Page 3, they will see duplicate articles they already read on Page 2.
- **The Solution:** The frontend generates a unique `seedRef` (a session ID) on mount. This seed is passed to the backend API. The backend uses this seed to ensure the feed order is locked for that specific user session. Additionally, the frontend maintains a `seen` Set to flat-map and deduplicate articles across pages as a final safety guard.

### 4.4. Security and UI
- **Auth:** Managed via `@supabase/ssr` (Server-Side Rendering). Cookies are used to validate sessions on the server before rendering protected routes.
- **WebGL:** A highly optimized WebGL fluid simulation (`LiquidEther.tsx`) is used as a background. It utilizes IntersectionObservers to pause the GPU simulation when the user scrolls it out of view, saving battery life.

**How to Scale/Improve the Frontend:**
- **CDN Caching:** The Next.js API routes could be moved to the Edge (Cloudflare Workers or Vercel Edge Functions) to serve the materialized views geographically closer to the user.
- **Security Patch:** The `next.config.ts` currently allows remote images from `**` (all domains). This is a security risk (SSRF vulnerabilities). It should be locked down to the specific CDNs used by the news sources, or the backend should proxy and resize images through an AWS S3/CloudFront bucket.

---

## 5. Summary of Engineering Flexes (Interview Talking Points)

If defending this architecture in an interview, emphasize these core engineering principles applied in the project:

1. **Defensive Data Engineering:** Implementing the **Semantic Consistency Guardrail** to mathematically prove the quality of scraped data before wasting expensive GPU compute on it.
2. **Handling LLM Constraints:** Engineering a **Map-Reduce text chunking algorithm** to overcome the context-window limitations of sequence-to-sequence models during summarization.
3. **Database Performance Push-Down:** Moving heavy aggregation math off the API layer and into **PostgreSQL Materialized Cache RPCs** triggered by pipeline events.
4. **Event-Driven UI:** Abandoning HTTP polling in favor of **WebSocket-driven React Query cache invalidation**, ensuring UI freshness with minimal server load.
5. **Deterministic UX:** Utilizing **session seeds** to prevent the infamous "shifting pagination duplicate" problem common in real-time infinite-scroll applications.
