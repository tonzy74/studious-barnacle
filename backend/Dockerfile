# Build stage: compile native extensions
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage: lean production image
FROM python:3.11-slim

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Install Playwright browser dependencies (no build-essential needed)
RUN playwright install chromium --with-deps \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and data directory
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && mkdir -p /app/data && chown -R appuser:appuser /app

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

ENV PORT=8000
EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
