# Use the Python devcontainer and install the pinned Node.js runtime below.
# https://hub.docker.com/r/microsoft/devcontainers-python
FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

# The legacy base image includes an obsolete Yarn apt source whose signing key
# is no longer available. Remove it before the NodeSource setup script refreshes apt.
RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs=22.23.5-1nodesource1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/uv.lock /tmp/backend/

# install uv (root is fine; it's just a binary)
RUN pip3 --disable-pip-version-check --no-cache-dir install uv==0.13.8

# --- python deps in a venv owned by vscode ---
ENV VENV_PATH=/home/vscode/.venv
ENV UV_PROJECT_ENVIRONMENT="$VENV_PATH"
RUN mkdir -p /home/vscode \
    && chown -R vscode:vscode /home/vscode

USER vscode

RUN uv sync --project /tmp/backend --locked

# make the venv the default python/pip
ENV PATH="$VENV_PATH/bin:$PATH"

# For browser setup, see backend/README.md, Browsing / Scraping.
