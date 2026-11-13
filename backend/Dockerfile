# Use Python 3.12 as base
FROM python:3.12-slim AS dependencies

RUN pip install --no-cache-dir uv==0.13.8

# Set a working directory
WORKDIR /app

# Constrain thread oversubscription for 1 vCPU workers
ENV OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false \
    UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies required for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
# The lock selects CPU-only PyTorch wheels on Linux.
RUN uv sync --locked --no-dev --no-cache

FROM dependencies AS test
RUN uv sync --locked --no-cache
COPY . .
RUN SENTRY_DSN='' HF_HUB_OFFLINE=1 USE_DEV_SETTINGS=true \
    ELASTIC_INDEX=policy_vectorstore_offline_v2 PYTHONPATH=. \
    python -m pytest tests -q --disable-socket --allow-unix-socket \
    && touch /tmp/offline-tests-passed

FROM dependencies AS runtime
# Make the offline test stage a required dependency of every worker image build.
COPY --from=test /tmp/offline-tests-passed /tmp/offline-tests-passed

# Install Playwright Browsers (Chromium) and OS dependencies
RUN python -m playwright install chromium && \
    python -m playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Copy the entire application code into the container
COPY . .

# Set the entrypoint to your watchdog script
ENTRYPOINT ["python", "watchdog.py"]
