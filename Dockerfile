# ---- Stage 1: Build the Next.js frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY frontend/ .

# Static export — produces /frontend/out with plain HTML/JS/CSS
RUN npm run build

# ---- Stage 2: Build Python dependencies ----
FROM python:3.11-slim AS backend-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 3: Runtime ----
FROM python:3.11-slim

WORKDIR /app

# Copy Python packages
COPY --from=backend-builder /install /usr/local

# Install Playwright browser deps
RUN playwright install chromium --with-deps \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and data directory
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && mkdir -p /app/data && chown appuser:appuser /app/data

# Copy backend code
COPY backend/ .

# Copy built frontend static files
COPY --from=frontend-builder /frontend/.next/static ./.next/static
COPY --from=frontend-builder /frontend/out ./static

RUN chown -R appuser:appuser /app

USER appuser

ENV PORT=8000
EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
