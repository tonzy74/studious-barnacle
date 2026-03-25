import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.security import SecurityHeaders, CSRFMiddleware
from app.database import init_db, close_db
from app.routers import auth, profile, jobs, applications

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    logger.info("Starting LinkedIn Job Agent API...")
    await init_db()
    logger.info("Database initialized.")

    from app.services.scheduler import JobScheduler
    scheduler = JobScheduler()
    scheduler.start()
    logger.info("Job scheduler started.")

    yield

    scheduler.stop()
    logger.info("Job scheduler stopped.")
    await close_db()
    logger.info("Database connection closed.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    is_production = os.getenv("ENVIRONMENT", "production") == "production"
    application = FastAPI(
        title="LinkedIn Job Agent API",
        description="Automated LinkedIn job search, matching, and application agent.",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
    )

    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
        expose_headers=["X-CSRF-Token"],
    )

    application.add_middleware(SecurityHeaders)
    application.add_middleware(CSRFMiddleware)

    application.include_router(auth.router, prefix="/api")
    application.include_router(profile.router, prefix="/api")
    application.include_router(jobs.router, prefix="/api")
    application.include_router(applications.router, prefix="/api")

    @application.get("/api/health")
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}

    return application


app = create_app()
