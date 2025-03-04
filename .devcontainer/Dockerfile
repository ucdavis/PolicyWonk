# Use the python devcontainer which also installs Node.js via devcontainer.json
# https://hub.docker.com/r/microsoft/devcontainers-python
FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

# Set up a virtual environment and install Python dependencies
COPY backend/requirements.txt /tmp/pip-tmp/
RUN pip3 --disable-pip-version-check --no-cache-dir install -r /tmp/pip-tmp/requirements.txt \
    && rm -rf /tmp/pip-tmp

# We are not yet using playwright for web scraping. Uncomment the following lines once we need playwright
# Install Playwright and download chromium
# RUN python3 -m playwright install chromium && \
#     playwright install-deps chromium