# Use Python 3.12 as base
FROM python:3.12-slim

# Set a working directory
WORKDIR /app

# Constrain thread oversubscription for 1 vCPU workers
ENV OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false

# Install dependencies required for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install CPU-only PyTorch wheels to avoid pulling CUDA/NVIDIA runtime libraries
# (which can exceed the disk available on hosted CI agents).
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    torch==2.10.0+cpu torchvision==0.25.0+cpu

# Install Python dependencies (including Playwright)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Browsers (Chromium) and OS dependencies
RUN python -m playwright install chromium && \
    python -m playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy the entire application code into the container
COPY . .

# Set the entrypoint to your watchdog script
ENTRYPOINT ["python", "watchdog.py"]
