from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import get_settings, Settings
from app.security import get_jwt_manager, get_session_manager, get_csrf_protection, JWTManager, SessionManager, RateLimitConfig
from app.models.user import User

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the JWT token."""
    jwt_manager = get_jwt_manager()
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = jwt_manager.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.encrypted_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been invalidated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def _issue_tokens(user: User, response: Response, settings: Settings):
    """Create JWT + CSRF tokens and set cookies. Returns the JWT token."""
    session_manager = get_session_manager()
    encrypted_session = session_manager.create_session_token(user.id, str(user.id))
    user.encrypted_session_token = encrypted_session

    jwt_manager = get_jwt_manager()
    jwt_token = jwt_manager.create_access_token(
        data={"sub": str(user.id)}
    )

    csrf = get_csrf_protection()
    csrf_token = csrf.generate_token(str(user.id))

    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.SESSION_EXPIRY_HOURS * 3600,
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=True,
        samesite="lax",
        max_age=settings.SESSION_EXPIRY_HOURS * 3600,
    )

    return jwt_token


@router.post("/register")
@limiter.limit(RateLimitConfig.AUTH_LIMIT)
async def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """Register a new user with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        name=data.name,
        password_hash="placeholder",
    )
    user.set_password(data.password)
    db.add(user)
    await db.flush()

    _issue_tokens(user, response, settings)

    await db.commit()
    await db.refresh(user)

    return {
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }


@router.post("/login")
@limiter.limit(RateLimitConfig.AUTH_LIMIT)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """Authenticate a user with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user is None or not user.verify_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _issue_tokens(user, response, settings)

    await db.commit()
    await db.refresh(user)

    return {
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "headline": user.headline,
            "location": user.location,
        },
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate the current session and clear cookies."""
    current_user.encrypted_session_token = None
    await db.commit()

    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")

    return {"message": "Successfully logged out"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's information."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "headline": current_user.headline,
        "location": current_user.location,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
