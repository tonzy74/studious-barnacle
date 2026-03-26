"""Tests for CSRF middleware and security headers middleware."""
import pytest


@pytest.mark.asyncio
class TestSecurityHeadersMiddleware:
    """Verify all OWASP security headers are set on responses."""

    async def test_health_endpoint_has_security_headers(self, client):
        resp = await client.get("/api/health")
        assert resp.status_code == 200

        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"
        assert "max-age=31536000" in resp.headers["Strict-Transport-Security"]
        assert "default-src 'self'" in resp.headers["Content-Security-Policy"]
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        assert "camera=()" in resp.headers["Permissions-Policy"]
        assert resp.headers["Cache-Control"] == "no-store, no-cache, must-revalidate"
        assert resp.headers["Pragma"] == "no-cache"

    async def test_coop_coep_corp_headers(self, client):
        resp = await client.get("/api/health")
        assert resp.headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert resp.headers["Cross-Origin-Embedder-Policy"] == "require-corp"
        assert resp.headers["Cross-Origin-Resource-Policy"] == "same-origin"


@pytest.mark.asyncio
class TestCSRFMiddleware:
    """Test CSRF middleware enforcement on mutating requests."""

    async def test_get_requests_bypass_csrf(self, client):
        """GET requests should not require CSRF tokens."""
        resp = await client.get("/api/health")
        assert resp.status_code == 200

    async def test_post_without_csrf_rejected(self, client):
        """POST without CSRF token should be rejected with 403."""
        resp = await client.post("/api/auth/logout")
        assert resp.status_code == 403
        assert "CSRF" in resp.json()["detail"]

    async def test_post_with_invalid_csrf_rejected(self, client, auth_headers):
        """POST with invalid CSRF token should be rejected."""
        headers = {**auth_headers, "X-CSRF-Token": "invalid:token:value"}
        resp = await client.post("/api/auth/logout", headers=headers)
        assert resp.status_code == 403

    async def test_post_without_jwt_but_with_csrf_rejected(self, client):
        """POST with CSRF but no JWT should be rejected (bypass fix)."""
        headers = {"X-CSRF-Token": "some:fake:token"}
        resp = await client.post("/api/auth/logout", headers=headers)
        assert resp.status_code == 403

    async def test_post_with_valid_csrf_and_jwt_accepted(self, client, auth_headers):
        """POST with valid CSRF + JWT should pass through to endpoint."""
        resp = await client.post("/api/auth/logout", headers=auth_headers)
        # Should get through CSRF middleware (may get 401 from endpoint if session check fails,
        # but NOT 403 from CSRF middleware)
        assert resp.status_code != 403

    async def test_csrf_exempt_paths(self, client):
        """Auth paths (login, register) should be CSRF-exempt."""
        # POST to /api/auth/login without CSRF should not get 403
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "password123"},
        )
        assert resp.status_code != 403
