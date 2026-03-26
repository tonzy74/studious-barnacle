import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.fernet import Fernet
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
import jwt
import re

from app.config import get_settings


class SecurityHeaders(BaseHTTPMiddleware):
    """Middleware to add OWASP-recommended security headers to all responses."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        return response


class CSRFProtection:
    """CSRF token generation and validation."""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def generate_token(self, session_id: str) -> str:
        timestamp = str(int(datetime.now(timezone.utc).timestamp()))
        payload = f"{session_id}:{timestamp}"
        signature = hmac.new(
            self.secret_key.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()
        return f"{payload}:{signature}"

    def validate_token(self, token: str, session_id: str, max_age_seconds: int = 3600) -> bool:
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
            token_session_id, timestamp_str, signature = parts
            if token_session_id != session_id:
                return False
            expected_payload = f"{token_session_id}:{timestamp_str}"
            expected_signature = hmac.new(
                self.secret_key.encode(), expected_payload.encode(), hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(signature, expected_signature):
                return False
            timestamp = int(timestamp_str)
            now = int(datetime.now(timezone.utc).timestamp())
            if now - timestamp > max_age_seconds:
                return False
            return True
        except (ValueError, IndexError):
            return False


class SessionManager:
    """Manage encrypted session tokens using Fernet symmetric encryption."""

    def __init__(self, encryption_key: str):
        self.fernet = Fernet(encryption_key.encode())

    def create_session_token(self, user_id: int, oauth_id: str) -> str:
        session_data = f"{user_id}:{oauth_id}:{secrets.token_hex(16)}:{int(datetime.now(timezone.utc).timestamp())}"
        return self.fernet.encrypt(session_data.encode()).decode()

    def decrypt_session_token(self, encrypted_token: str) -> Optional[dict]:
        try:
            decrypted = self.fernet.decrypt(encrypted_token.encode()).decode()
            parts = decrypted.split(":")
            if len(parts) != 4:
                return None
            return {
                "user_id": int(parts[0]),
                "oauth_id": parts[1],
                "nonce": parts[2],
                "created_at": int(parts[3]),
            }
        except Exception:
            return None

    def is_session_valid(self, encrypted_token: str, expiry_hours: int = 24) -> bool:
        data = self.decrypt_session_token(encrypted_token)
        if data is None:
            return False
        created_at = datetime.fromtimestamp(data["created_at"], tz=timezone.utc)
        return datetime.now(timezone.utc) - created_at < timedelta(hours=expiry_hours)


class JWTManager:
    """JWT token creation and verification."""

    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def create_access_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            return payload
        except (jwt.PyJWTError, Exception):
            return None


class InputSanitizer:
    """Sanitize and validate user inputs to prevent injection attacks."""

    DANGEROUS_PATTERNS = [
        re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"on\w+\s*=", re.IGNORECASE),
        re.compile(r"<iframe[^>]*>", re.IGNORECASE),
        re.compile(r"<object[^>]*>", re.IGNORECASE),
        re.compile(r"<embed[^>]*>", re.IGNORECASE),
    ]

    SQL_INJECTION_PATTERNS = [
        re.compile(r"(\b(union|select|insert|update|delete|drop|alter)\b.*\b(from|into|table|database)\b)", re.IGNORECASE),
        re.compile(r"(--|#|/\*)", re.IGNORECASE),
        re.compile(r"(\b(or|and)\b\s+\d+\s*=\s*\d+)", re.IGNORECASE),
    ]

    @classmethod
    def sanitize_string(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        sanitized = value
        sanitized = sanitized.replace("<", "&lt;").replace(">", "&gt;")
        sanitized = sanitized.replace("'", "&#39;").replace('"', "&quot;")
        sanitized = sanitized.strip()
        return sanitized

    @classmethod
    def is_safe_input(cls, value: str) -> bool:
        if not isinstance(value, str):
            return True
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(value):
                return False
        return True

    @classmethod
    def validate_url(cls, url: str) -> bool:
        url_pattern = re.compile(
            r"^https?://"
            r"(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+"
            r"[a-zA-Z]{2,}"
            r"(?:/[^\s]*)?$"
        )
        return bool(url_pattern.match(url))

    @classmethod
    def validate_email(cls, email: str) -> bool:
        email_pattern = re.compile(
            r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        )
        return bool(email_pattern.match(email))


def get_csrf_protection() -> CSRFProtection:
    settings = get_settings()
    return CSRFProtection(settings.SECRET_KEY)


def get_session_manager() -> SessionManager:
    settings = get_settings()
    return SessionManager(settings.ENCRYPTION_KEY)


def get_jwt_manager() -> JWTManager:
    settings = get_settings()
    return JWTManager(settings.SECRET_KEY)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware to validate CSRF tokens on mutating requests."""

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    CSRF_EXEMPT_PATHS = {"/api/auth/login", "/api/auth/callback"}

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.method in self.SAFE_METHODS:
            return await call_next(request)

        if request.url.path in self.CSRF_EXEMPT_PATHS:
            return await call_next(request)

        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            return JSONResponse(
                status_code=403, content={"detail": "Missing CSRF token"}
            )

        jwt_manager = get_jwt_manager()
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
        else:
            token = request.cookies.get("access_token")

        if not token:
            return JSONResponse(
                status_code=403, content={"detail": "Invalid CSRF token"}
            )

        payload = jwt_manager.verify_token(token)
        if not payload:
            return JSONResponse(
                status_code=403, content={"detail": "Invalid CSRF token"}
            )

        session_id = payload.get("sub", "")
        csrf = get_csrf_protection()
        if not csrf.validate_token(csrf_token, session_id):
            return JSONResponse(
                status_code=403, content={"detail": "Invalid CSRF token"}
            )

        return await call_next(request)


class RateLimitConfig:
    """Rate limiting configuration for different endpoint groups."""

    AUTH_LIMIT = "5/minute"
    API_LIMIT = "60/minute"
    SCRAPE_LIMIT = "10/minute"
    APPLY_LIMIT = "5/hour"
    SEARCH_LIMIT = "10/minute"
