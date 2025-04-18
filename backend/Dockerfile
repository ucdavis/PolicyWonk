# Use Python 3.12 as base
FROM python:3.12-slim

# Set a working directory
WORKDIR /app

# Install dependencies required for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install Python dependencies (including Playwright)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Browsers (Chromium) and dependencies
RUN python -m playwright install chromium
RUN python -m playwright install-deps chromium

# Copy the entire application code into the container
COPY . .

# Set the entrypoint to your watchdog script
ENTRYPOINT ["python", "watchdog.py"]
