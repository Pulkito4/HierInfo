# News Processing Pipeline - Dockerfile
# Optimized for production deployment with minimal image size

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Set fixed location for Playwright browsers so all users can find them
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create the folder and give everyone permission to use it
RUN mkdir -p $PLAYWRIGHT_BROWSERS_PATH && chmod 777 $PLAYWRIGHT_BROWSERS_PATH

# Install Playwright dependencies
RUN pip install --no-cache-dir playwright==1.55.0 && \
    playwright install chromium && \
    playwright install-deps chromium

COPY requirements.lock ./requirements.lock
RUN pip install --no-cache-dir -r requirements.lock

# Set HuggingFace cache directory (HF_HOME is the standard cache location)
ENV HF_HOME=/app/.cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence-transformers

# Create cache directory
RUN mkdir -p /app/.cache

# Pre-download and cache ML models (saves 2-5 min on first run)
# This downloads models during Docker build instead of runtime
RUN python -c "from transformers import pipeline; from sentence_transformers import SentenceTransformer; \
    print('Downloading summarization model...'); \
    pipeline('summarization', model='sshleifer/distilbart-cnn-12-6'); \
    print('Downloading classification model...'); \
    pipeline('zero-shot-classification', model='valhalla/distilbart-mnli-12-1'); \
    print('Downloading embedding model...'); \
    SentenceTransformer('all-MiniLM-L6-v2'); \
    print('All models cached successfully!')"

# Copy application code
COPY src/ ./src/
COPY utils/ ./utils/
COPY main.py .

# Create directories for logs
RUN mkdir -p logs

# Set environment variables
ENV PYTHONPATH=/app
ENV LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

# Create non-root user for security and fix permissions
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app && \
    chown -R app:app /app/.cache
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD python -c "import sys; print('ok')" || exit 1

# Default command
CMD ["python", "main.py"]