import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import get_settings, Settings
from app.security import get_jwt_manager, get_session_manager, get_csrf_protection, JWTManager, SessionManager, RateLimitConfig
from app.services.linkedin_auth import LinkedInAuthService
from app.models.user import User

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["authentication"])


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


@router.get("/linkedin")
@limiter.limit(RateLimitConfig.AUTH_LIMIT)
async def linkedin_login(
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
):
    """Redirect the user to LinkedIn OAuth authorization page."""
    state = secrets.token_urlsafe(32)
    auth_service = LinkedInAuthService(
        client_id=settings.LINKEDIN_CLIENT_ID,
        client_secret=settings.LINKEDIN_CLIENT_SECRET,
        redirect_uri=settings.LINKEDIN_REDIRECT_URI,
    )
    auth_url = auth_service.get_authorization_url(state=state)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600,
    )
    return {"authorization_url": auth_url}


@router.get("/callback")
@limiter.limit(RateLimitConfig.AUTH_LIMIT)
async def linkedin_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """Handle LinkedIn OAuth callback, create/update user, and return JWT."""
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or not secrets.compare_digest(state, stored_state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state parameter",
        )
    response.delete_cookie("oauth_state")

    auth_service = LinkedInAuthService(
        client_id=settings.LINKEDIN_CLIENT_ID,
        client_secret=settings.LINKEDIN_CLIENT_SECRET,
        redirect_uri=settings.LINKEDIN_REDIRECT_URI,
    )

    token_data = await auth_service.exchange_code(code)
    if not token_data or "access_token" not in token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code",
        )

    access_token = token_data["access_token"]
    profile = await auth_service.get_user_profile(access_token)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch LinkedIn profile",
        )

    oauth_id = profile.get("sub", profile.get("id", ""))
    email = profile.get("email", "")
    name = profile.get("name", "")

    result = await db.execute(select(User).where(User.oauth_id == oauth_id))
    user = result.scalar_one_or_none()

    session_manager = get_session_manager()

    if user is None:
        user = User(
            oauth_id=oauth_id,
            name=name,
            email=email,
            headline=profile.get("headline", ""),
            location=profile.get("location", ""),
            profile_data=profile,
        )
        db.add(user)
        await db.flush()
    else:
        user.name = name
        user.email = email
        user.profile_data = profile
        if profile.get("headline"):
            user.headline = profile["headline"]
        if profile.get("location"):
            user.location = profile["location"]

    encrypted_session = session_manager.create_session_token(user.id, oauth_id)
    user.encrypted_session_token = encrypted_session
    await db.commit()
    await db.refresh(user)

    jwt_manager = get_jwt_manager()
    jwt_token = jwt_manager.create_access_token(
        data={"sub": str(user.id), "oauth_id": oauth_id}
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
