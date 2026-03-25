"""Tests for the multi-source search API endpoint."""
import pytest
from unittest.mock import patch, AsyncMock

from app.services.job_sources.base import JobListing
from app.models.criteria import SearchCriteria


@pytest.mark.asyncio
class TestMultiSourceSearchEndpoint:
    """Test the /jobs/search/multi endpoint."""

    async def test_requires_auth(self, client):
        resp = await client.post("/api/jobs/search/multi", json={})
        assert resp.status_code in (401, 403)

    async def test_requires_criteria(self, client, auth_headers):
        """Should fail if no target titles set."""
        resp = await client.post(
            "/api/jobs/search/multi",
            headers=auth_headers,
            json={},
        )
        assert resp.status_code == 400
        assert "target titles" in resp.json()["detail"].lower()

    async def test_search_with_titles(self, client, auth_headers, db_session, test_user):
        """Should search and return results from aggregator."""
        # Set up criteria
        criteria = SearchCriteria(
            user_id=test_user.id,
            target_titles=["Software Engineer"],
            location="Remote",
            daily_batch_size=5,
        )
        db_session.add(criteria)
        await db_session.commit()

        mock_listings = [
            JobListing(
                source="remoteok",
                source_id="test_1",
                title="Software Engineer",
                company="TestCo",
                location="Remote",
                description="Build things",
                salary_min=150000,
                salary_max=200000,
                remote_type="remote",
                job_url="https://example.com/job/1",
                apply_url="https://example.com/job/1/apply",
            ),
        ]

        with patch(
            "app.routers.jobs.JobAggregator"
        ) as MockAggregator:
            mock_instance = MockAggregator.return_value
            mock_instance.search = AsyncMock(return_value=mock_listings)
            mock_instance.source_names = ["RemoteOK", "Arbeitnow", "The Muse"]
            mock_instance._sources = []

            resp = await client.post(
                "/api/jobs/search/multi",
                headers=auth_headers,
                json={},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["sources"] == ["RemoteOK", "Arbeitnow", "The Muse"]
        assert data["new_jobs_added"] >= 0

    async def test_search_with_inline_titles(self, client, auth_headers):
        """Should accept titles in the request body."""
        with patch(
            "app.routers.jobs.JobAggregator"
        ) as MockAggregator:
            mock_instance = MockAggregator.return_value
            mock_instance.search = AsyncMock(return_value=[])
            mock_instance.source_names = ["RemoteOK"]
            mock_instance._sources = []

            resp = await client.post(
                "/api/jobs/search/multi",
                headers=auth_headers,
                json={"target_titles": ["Backend Developer"]},
            )

        assert resp.status_code == 200


@pytest.mark.asyncio
class TestJobSourcesEndpoint:
    """Test the /jobs/sources endpoint."""

    async def test_list_sources(self, client, auth_headers):
        resp = await client.get("/api/jobs/sources", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "sources" in data
        assert isinstance(data["sources"], list)
        # Should have at least the 3 free sources
        names = [s["name"] for s in data["sources"]]
        assert "RemoteOK" in names
        assert "Arbeitnow" in names
        assert "The Muse" in names

    async def test_requires_auth(self, client):
        resp = await client.get("/api/jobs/sources")
        assert resp.status_code == 401
