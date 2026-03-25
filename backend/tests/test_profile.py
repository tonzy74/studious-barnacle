"""Tests for profile endpoints."""
import pytest

from app.models.criteria import SearchCriteria


@pytest.mark.asyncio
class TestGetProfile:
    """Test the /profile endpoint."""

    async def test_get_profile_authenticated(self, client, auth_headers):
        resp = await client.get("/api/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert data["linkedin_id"] == "test_linkedin_123"

    async def test_get_profile_unauthenticated(self, client):
        resp = await client.get("/api/profile")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestUpdateCriteria:
    """Test the PUT /profile/criteria endpoint."""

    async def test_create_criteria(self, client, auth_headers):
        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={
                "target_titles": ["Software Engineer", "Backend Developer"],
                "location": "San Francisco",
                "min_salary_same_level": 200000,
                "max_office_days": 2,
                "remote_ok": True,
                "daily_batch_size": 5,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["criteria"]["target_titles"] == ["Software Engineer", "Backend Developer"]
        assert data["criteria"]["daily_batch_size"] == 5
        assert data["criteria"]["max_office_days"] == 2

    async def test_update_criteria_partial(self, client, auth_headers, db_session, test_user):
        """Partial updates should only change specified fields."""
        criteria = SearchCriteria(
            user_id=test_user.id,
            target_titles=["Engineer"],
            location="NYC",
            daily_batch_size=10,
        )
        db_session.add(criteria)
        await db_session.commit()

        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"daily_batch_size": 3},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["criteria"]["daily_batch_size"] == 3
        assert data["criteria"]["target_titles"] == ["Engineer"]  # unchanged
        assert data["criteria"]["location"] == "NYC"  # unchanged

    async def test_criteria_max_office_days_validation(self, client, auth_headers):
        """max_office_days must be 0-7."""
        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"max_office_days": 10},
        )
        assert resp.status_code == 422

    async def test_criteria_daily_batch_size_validation(self, client, auth_headers):
        """daily_batch_size must be 1-50."""
        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"daily_batch_size": 0},
        )
        assert resp.status_code == 422

        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"daily_batch_size": 100},
        )
        assert resp.status_code == 422

    async def test_criteria_extra_fields_rejected(self, client, auth_headers):
        """Extra fields should be rejected (model_config extra=forbid)."""
        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"unknown_field": "value"},
        )
        assert resp.status_code == 422

    async def test_criteria_xss_sanitization(self, client, auth_headers):
        """HTML in titles should be sanitized."""
        resp = await client.put(
            "/api/profile/criteria",
            headers=auth_headers,
            json={"target_titles": ["<script>alert(1)</script>Engineer"]},
        )
        assert resp.status_code == 200
        titles = resp.json()["criteria"]["target_titles"]
        assert "<script>" not in titles[0]
        assert "&lt;" in titles[0]
