"""Tests for authentication endpoints."""
import pytest

from app.security import get_jwt_manager, get_csrf_protection


@pytest.mark.asyncio
class TestGetMe:
    """Test the /auth/me endpoint."""

    async def test_get_me_authenticated(self, client, auth_headers):
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert data["headline"] == "Software Engineer"
        assert data["location"] == "San Francisco, CA"

    async def test_get_me_no_profile_data_leak(self, client, auth_headers):
        """Verify raw profile_data is NOT exposed in /auth/me response."""
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "profile_data" not in data

    async def test_get_me_unauthenticated(self, client):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_get_me_invalid_token(self, client):
        headers = {"Authorization": "Bearer invalid.token.here"}
        resp = await client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    """Test the logout endpoint and session invalidation."""

    async def test_logout_invalidates_session(self, client, auth_headers, test_user, db_session):
        """After logout, the same token should no longer work."""
        # First, verify we can access /me
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200

        # Logout
        resp = await client.post("/api/auth/logout", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "Successfully logged out"

        # Now the same token should fail because session is invalidated
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 401
        assert "invalidated" in resp.json()["detail"].lower()

    async def test_logout_without_auth(self, client):
        resp = await client.post("/api/auth/logout")
        # Should be rejected by CSRF middleware first (403) or auth (401)
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestSessionInvalidation:
    """Test that cleared session tokens block access."""

    async def test_user_without_session_token_rejected(self, client, test_user, db_session):
        """User whose encrypted_session_token is None should get 401."""
        # Clear the session token
        test_user.encrypted_session_token = None
        await db_session.commit()

        jwt_manager = get_jwt_manager()
        token = jwt_manager.create_access_token(
            data={"sub": str(test_user.id)}
        )

        resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401
        assert "invalidated" in resp.json()["detail"].lower()
