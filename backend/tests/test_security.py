"""Tests for security module: CSRF, JWT, session management, input sanitization."""
import time
from datetime import timedelta

import pytest

from app.security import (
    CSRFProtection,
    JWTManager,
    SessionManager,
    InputSanitizer,
    get_jwt_manager,
    get_csrf_protection,
    get_session_manager,
)


class TestCSRFProtection:
    """Test CSRF token generation and validation."""

    def setup_method(self):
        self.csrf = CSRFProtection("test-secret-key-that-is-long-enough")

    def test_generate_token_format(self):
        token = self.csrf.generate_token("user123")
        parts = token.split(":")
        assert len(parts) == 3
        assert parts[0] == "user123"

    def test_validate_valid_token(self):
        token = self.csrf.generate_token("user123")
        assert self.csrf.validate_token(token, "user123") is True

    def test_validate_wrong_session(self):
        token = self.csrf.generate_token("user123")
        assert self.csrf.validate_token(token, "user456") is False

    def test_validate_tampered_signature(self):
        token = self.csrf.generate_token("user123")
        parts = token.split(":")
        tampered = f"{parts[0]}:{parts[1]}:{'0' * 64}"
        assert self.csrf.validate_token(tampered, "user123") is False

    def test_validate_expired_token(self):
        token = self.csrf.generate_token("user123")
        # max_age_seconds=-1 ensures the token is always expired
        assert self.csrf.validate_token(token, "user123", max_age_seconds=-1) is False

    def test_validate_malformed_token(self):
        assert self.csrf.validate_token("bad-token", "user123") is False
        assert self.csrf.validate_token("", "user123") is False
        assert self.csrf.validate_token("a:b", "user123") is False

    def test_validate_non_numeric_timestamp(self):
        assert self.csrf.validate_token("user123:notanumber:sig", "user123") is False


class TestJWTManager:
    """Test JWT token creation and verification."""

    def setup_method(self):
        self.jwt_mgr = JWTManager("test-secret-key-that-is-long-enough")

    def test_create_and_verify_token(self):
        token = self.jwt_mgr.create_access_token({"sub": "42", "role": "user"})
        payload = self.jwt_mgr.verify_token(token)
        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["role"] == "user"
        assert "exp" in payload
        assert "iat" in payload

    def test_expired_token(self):
        token = self.jwt_mgr.create_access_token(
            {"sub": "42"}, expires_delta=timedelta(seconds=-1)
        )
        assert self.jwt_mgr.verify_token(token) is None

    def test_invalid_token(self):
        assert self.jwt_mgr.verify_token("not.a.valid.token") is None
        assert self.jwt_mgr.verify_token("") is None

    def test_wrong_secret(self):
        token = self.jwt_mgr.create_access_token({"sub": "42"})
        other_mgr = JWTManager("different-secret-key-that-is-long-enough")
        assert other_mgr.verify_token(token) is None

    def test_custom_expiry(self):
        token = self.jwt_mgr.create_access_token(
            {"sub": "42"}, expires_delta=timedelta(hours=48)
        )
        payload = self.jwt_mgr.verify_token(token)
        assert payload is not None


class TestSessionManager:
    """Test Fernet-encrypted session token management."""

    def setup_method(self):
        from cryptography.fernet import Fernet
        self.key = Fernet.generate_key().decode()
        self.session_mgr = SessionManager(self.key)

    def test_create_and_decrypt(self):
        token = self.session_mgr.create_session_token(1, "linkedin_abc")
        data = self.session_mgr.decrypt_session_token(token)
        assert data is not None
        assert data["user_id"] == 1
        assert data["linkedin_id"] == "linkedin_abc"
        assert len(data["nonce"]) == 32  # hex(16 bytes)
        assert isinstance(data["created_at"], int)

    def test_decrypt_invalid_token(self):
        assert self.session_mgr.decrypt_session_token("invalid") is None
        assert self.session_mgr.decrypt_session_token("") is None

    def test_session_valid(self):
        token = self.session_mgr.create_session_token(1, "linkedin_abc")
        assert self.session_mgr.is_session_valid(token) is True

    def test_session_expired(self):
        token = self.session_mgr.create_session_token(1, "linkedin_abc")
        assert self.session_mgr.is_session_valid(token, expiry_hours=0) is False

    def test_different_key_cannot_decrypt(self):
        from cryptography.fernet import Fernet
        token = self.session_mgr.create_session_token(1, "abc")
        other_mgr = SessionManager(Fernet.generate_key().decode())
        assert other_mgr.decrypt_session_token(token) is None


class TestInputSanitizer:
    """Test input sanitization and validation."""

    def test_sanitize_html(self):
        result = InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "&lt;" in result

    def test_sanitize_quotes(self):
        result = InputSanitizer.sanitize_string("test'value\"here")
        assert "'" not in result
        assert '"' not in result

    def test_sanitize_strips_whitespace(self):
        assert InputSanitizer.sanitize_string("  hello  ") == "hello"

    def test_is_safe_input_clean(self):
        assert InputSanitizer.is_safe_input("Hello World") is True

    def test_is_safe_input_script(self):
        assert InputSanitizer.is_safe_input("<script>alert(1)</script>") is False

    def test_is_safe_input_javascript_uri(self):
        assert InputSanitizer.is_safe_input("javascript:void(0)") is False

    def test_is_safe_input_event_handler(self):
        assert InputSanitizer.is_safe_input('onerror=alert(1)') is False

    def test_is_safe_input_iframe(self):
        assert InputSanitizer.is_safe_input('<iframe src="evil">') is False

    def test_validate_url_valid(self):
        assert InputSanitizer.validate_url("https://www.linkedin.com/jobs/123") is True
        assert InputSanitizer.validate_url("http://example.com") is True

    def test_validate_url_invalid(self):
        assert InputSanitizer.validate_url("ftp://example.com") is False
        assert InputSanitizer.validate_url("not-a-url") is False
        assert InputSanitizer.validate_url("javascript:alert(1)") is False

    def test_validate_email_valid(self):
        assert InputSanitizer.validate_email("user@example.com") is True

    def test_validate_email_invalid(self):
        assert InputSanitizer.validate_email("not-an-email") is False
        assert InputSanitizer.validate_email("@example.com") is False
        assert InputSanitizer.validate_email("user@") is False

    def test_non_string_passthrough(self):
        assert InputSanitizer.sanitize_string(123) == 123
        assert InputSanitizer.is_safe_input(123) is True
