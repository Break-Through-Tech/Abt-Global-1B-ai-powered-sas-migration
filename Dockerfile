# syntax=docker/dockerfile:1
# Star Ratings Studio: the translated SAS pipeline (Programs 0-2) plus the web UI, in one image.
#   docker build -t star-ratings-studio .
#   docker run -p 8000:8000 star-ratings-studio     -> http://localhost:8000

# Stage 1: build the React frontend into static files
FROM node:22-alpine AS web
WORKDIR /web
COPY app/frontend/package.json app/frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/frontend/ ./
RUN npm run build

# Stage 2: Python runtime with the locked dependencies from uv.lock
FROM python:3.13-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1
WORKDIR /srv

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --group app --no-install-project

COPY app/__init__.py app/__init__.py
COPY app/backend app/backend
COPY data/Project_1/src data/Project_1/src
COPY data/Project_1/Starrating/alldata_2025jul.csv data/Project_1/Starrating/
COPY ["data/Project_1/SAS Output/*.sas7bdat", "data/Project_1/SAS Output/"]
COPY --from=web /web/dist app/frontend/dist

ARG GIT_SHA=local
ENV GIT_SHA=${GIT_SHA}

# Saved runs live here. Mount a volume so they survive container upgrades.
ENV RUNS_DIR=/srv/runs
RUN useradd --system --uid 10001 studio && mkdir -p /srv/runs && chown studio /srv/runs
VOLUME ["/srv/runs"]
USER studio
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"
CMD ["uvicorn", "app.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
