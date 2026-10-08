# Use the python devcontainer which also installs Node.js via devcontainer.json
# https://hub.docker.com/r/microsoft/devcontainers-python
FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

# The legacy base image includes an obsolete Yarn apt source whose signing key
# is no longer available. Remove it before the NodeSource setup script refreshes apt.
RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# copy requirements
COPY backend/requirements.txt /tmp/requirements.txt

# install uv (root is fine; it's just a binary)
RUN pip3 --disable-pip-version-check --no-cache-dir install uv

# --- python deps in a venv owned by vscode ---
ENV VENV_PATH=/home/vscode/.venv
RUN mkdir -p /home/vscode \
    && chown -R vscode:vscode /home/vscode

USER vscode

RUN uv venv "$VENV_PATH" \
    && uv pip install --python "$VENV_PATH/bin/python" -r /tmp/requirements.txt

# make the venv the default python/pip
ENV PATH="$VENV_PATH/bin:$PATH"

# We are not yet using playwright for web scraping. Uncomment the following lines once we need playwright
# Install Playwright and download chromium
# RUN python3 -m playwright install chromium && \
#     playwright install-deps chromium
