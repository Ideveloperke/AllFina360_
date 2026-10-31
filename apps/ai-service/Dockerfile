FROM python:3.12-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
RUN useradd --system --uid 10001 appuser
USER appuser

EXPOSE 8000
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--port", "8000"]
