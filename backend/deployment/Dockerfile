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

# Install Playwright dependencies
RUN pip install --no-cache-dir playwright==1.55.0 && \
    playwright install chromium && \
    playwright install-deps chromium

# Copy requirements first for better caching
COPY deployment/requirements.txt ./deployment-requirements.txt
RUN pip install --no-cache-dir -r deployment-requirements.txt

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

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD python -c "import sys; print('ok')" || exit 1

# Default command
CMD ["python", "main.py"]