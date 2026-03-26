"""Shared test fixtures for all backend tests."""
import os
import asyncio
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from cryptography.fernet import Fernet
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Set test environment variables before importing app modules
os.environ["SECRET_KEY"] = "a" * 64
os.environ["OAUTH_CLIENT_ID"] = "test_client_id"
os.environ["OAUTH_CLIENT_SECRET"] = "test_client_secret"
os.environ["OAUTH_REDIRECT_URI"] = "http://localhost:8000/auth/callback"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["ENVIRONMENT"] = "testing"

from app.database import Base, get_db
from app.config import get_settings, Settings
from app.security import get_jwt_manager, get_csrf_protection, get_session_manager
from app.models.user import User
from app.models.job import Job, JobStatus, RemoteType
from app.models.criteria import SearchCriteria


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_engine():
    """Create a fresh in-memory database engine for each test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Provide a test database session."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def app(db_engine):
    """Create a test FastAPI app with overridden dependencies."""
    # Clear the settings cache so test env vars are used
    get_settings.cache_clear()

    from app.main import create_app
    from app.database import get_db

    test_app = create_app()

    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    test_app.dependency_overrides[get_db] = override_get_db

    yield test_app

    test_app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest_asyncio.fixture
async def client(app):
    """Provide an async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def test_user(db_session):
    """Create a test user with a valid session token."""
    settings = get_settings()
    session_mgr = get_session_manager()

    user = User(
        oauth_id="test_oauth_123",
        name="Test User",
        email="test@example.com",
        headline="Software Engineer",
        location="San Francisco, CA",
        profile_data={"skills": ["Python", "FastAPI"], "experience": []},
    )
    db_session.add(user)
    await db_session.flush()

    # Create valid session token
    user.encrypted_session_token = session_mgr.create_session_token(
        user.id, user.oauth_id
    )
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user):
    """Generate valid JWT + CSRF headers for authenticated requests."""
    jwt_manager = get_jwt_manager()
    csrf = get_csrf_protection()

    token = jwt_manager.create_access_token(
        data={"sub": str(test_user.id), "oauth_id": test_user.oauth_id}
    )
    csrf_token = csrf.generate_token(str(test_user.id))

    return {
        "Authorization": f"Bearer {token}",
        "X-CSRF-Token": csrf_token,
    }


@pytest_asyncio.fixture
async def test_job(db_session, test_user):
    """Create a test job in APPROVED status."""
    job = Job(
        user_id=test_user.id,
        source_job_id="job_12345",
        title="Senior Software Engineer",
        company="TestCorp",
        location="Remote",
        salary_min=200000,
        salary_max=280000,
        remote_type=RemoteType.REMOTE,
        description="A great job",
        requirements="Python, FastAPI",
        confidence_score=0.85,
        status=JobStatus.APPROVED,
        job_url="https://example.com/jobs/12345",
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job
