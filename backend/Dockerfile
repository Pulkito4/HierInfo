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

# Install other Python requirements first (excluding torch)
COPY requirements.lock ./requirements.lock
RUN grep -v -E "^torch==" requirements.lock > requirements_no_torch.txt && \
    pip install --no-cache-dir -r requirements_no_torch.txt

# Install PyTorch with CUDA support AFTER other requirements (for GPU acceleration)
# Cloud Run L4 GPUs come with CUDA 12.2 drivers (version 535.216.03)
# Using PyTorch 2.6+ (required by transformers for security - CVE-2025-32434)
# CUDA 12.1 is forward-compatible with Cloud Run's CUDA 12.2 runtime
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Set HuggingFace cache directory (HF_HOME is the standard cache location)
ENV HF_HOME=/app/.cache
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence-transformers

# Create cache directory
RUN mkdir -p /app/.cache

# Pre-download and cache ML models (saves 2-5 min on first run)
# Note: Models will be downloaded at runtime on first execution if pre-download fails
# This is acceptable as models are cached for subsequent runs
RUN python -c "from sentence_transformers import SentenceTransformer; \
    print('Pre-downloading embedding model...'); \
    SentenceTransformer('all-MiniLM-L6-v2'); \
    print('Embedding model cached successfully!')" || echo "Model pre-download failed, will download at runtime"

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