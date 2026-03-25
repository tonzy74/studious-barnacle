"""Tests for health endpoint and app configuration."""
import pytest


@pytest.mark.asyncio
class TestHealthEndpoint:
    """Test the /api/health endpoint."""

    async def test_health_returns_200(self, client):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    async def test_health_no_version_exposed(self, client):
        """Health endpoint should not expose version information."""
        resp = await client.get("/api/health")
        data = resp.json()
        assert "version" not in data


@pytest.mark.asyncio
class TestValidationErrorHandler:
    """Test that validation errors return generic messages."""

    async def test_invalid_query_param_returns_generic_error(self, client, auth_headers):
        """Validation errors should not leak internal details."""
        resp = await client.get(
            "/api/jobs/history?page=notanumber", headers=auth_headers
        )
        assert resp.status_code == 422
        data = resp.json()
        assert data["detail"] == "Invalid request parameters."
        # Should NOT contain field names or type info
        assert "type" not in str(data).lower() or "invalid request" in str(data).lower()
