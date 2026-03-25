"""Tests for jobs and applications endpoints."""
import pytest
from datetime import datetime, timezone

from app.models.job import Job, JobStatus, RemoteType


@pytest.mark.asyncio
class TestDailyJobs:
    """Test the /jobs/daily endpoint."""

    async def test_get_daily_jobs_empty(self, client, auth_headers):
        resp = await client.get("/api/jobs/daily", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 0
        assert data["jobs"] == []

    async def test_get_daily_jobs_with_data(self, client, auth_headers, test_job):
        resp = await client.get("/api/jobs/daily", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 1
        assert data["jobs"][0]["title"] == "Senior Software Engineer"

    async def test_get_daily_jobs_unauthenticated(self, client):
        resp = await client.get("/api/jobs/daily")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestApproveReject:
    """Test job approve/reject endpoints."""

    async def test_approve_pending_job(self, client, auth_headers, db_session, test_user):
        job = Job(
            user_id=test_user.id,
            source_job_id="job_pending_1",
            title="Test Job",
            company="TestCo",
            status=JobStatus.PENDING,
            confidence_score=0.5,
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.post(
            f"/api/jobs/{job.id}/approve", headers=auth_headers
        )
        assert resp.status_code == 200
        assert resp.json()["job"]["status"] == "approved"

    async def test_approve_already_applied_job_fails(self, client, auth_headers, db_session, test_user):
        job = Job(
            user_id=test_user.id,
            source_job_id="job_applied_1",
            title="Applied Job",
            company="TestCo",
            status=JobStatus.APPLIED,
            confidence_score=0.5,
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.post(
            f"/api/jobs/{job.id}/approve", headers=auth_headers
        )
        assert resp.status_code == 400

    async def test_reject_pending_job(self, client, auth_headers, db_session, test_user):
        job = Job(
            user_id=test_user.id,
            source_job_id="job_pending_2",
            title="Another Job",
            company="TestCo",
            status=JobStatus.PENDING,
            confidence_score=0.3,
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.post(
            f"/api/jobs/{job.id}/reject", headers=auth_headers
        )
        assert resp.status_code == 200
        assert resp.json()["job"]["status"] == "rejected"

    async def test_approve_nonexistent_job_404(self, client, auth_headers):
        resp = await client.post("/api/jobs/99999/approve", headers=auth_headers)
        assert resp.status_code == 404

    async def test_other_users_job_not_accessible(self, client, auth_headers, db_session):
        """Jobs belonging to other users should return 404."""
        job = Job(
            user_id=99999,  # different user
            source_job_id="other_user_job",
            title="Other User Job",
            company="OtherCo",
            status=JobStatus.PENDING,
            confidence_score=0.5,
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.post(
            f"/api/jobs/{job.id}/approve", headers=auth_headers
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestJobHistory:
    """Test the /jobs/history endpoint."""

    async def test_get_history_empty(self, client, auth_headers):
        resp = await client.get("/api/jobs/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0

    async def test_get_history_with_pagination(self, client, auth_headers, db_session, test_user):
        for i in range(5):
            db_session.add(Job(
                user_id=test_user.id,
                source_job_id=f"hist_job_{i}",
                title=f"Job {i}",
                company="TestCo",
                status=JobStatus.PENDING,
                confidence_score=0.5,
            ))
        await db_session.commit()

        resp = await client.get(
            "/api/jobs/history?page=1&per_page=2", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 5
        assert len(data["jobs"]) == 2
        assert data["total_pages"] == 3

    async def test_get_history_invalid_status_filter(self, client, auth_headers):
        resp = await client.get(
            "/api/jobs/history?status=invalid_status", headers=auth_headers
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
class TestApplications:
    """Test the /applications endpoints."""

    async def test_list_applications_empty(self, client, auth_headers):
        resp = await client.get("/api/applications", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0

    async def test_list_applications_with_data(self, client, auth_headers, test_job):
        """Approved job should show in applications list."""
        resp = await client.get("/api/applications", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    async def test_get_application_status(self, client, auth_headers, test_job):
        resp = await client.get(
            f"/api/applications/{test_job.id}/status", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "approved"

    async def test_get_application_status_not_found(self, client, auth_headers):
        resp = await client.get(
            "/api/applications/99999/status", headers=auth_headers
        )
        assert resp.status_code == 404

    async def test_error_message_not_leaked(self, client, auth_headers, db_session, test_user):
        """Error messages stored in DB should be masked in API responses."""
        job = Job(
            user_id=test_user.id,
            source_job_id="error_job_1",
            title="Error Job",
            company="TestCo",
            status=JobStatus.ERROR,
            confidence_score=0.5,
            error_message="Traceback: internal server error at line 42",
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.get(
            f"/api/applications/{job.id}/status", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        # Should show generic message, not the raw traceback
        assert data["error_message"] == "An error occurred during application."
        assert "Traceback" not in str(data)


@pytest.mark.asyncio
class TestApplyToJob:
    """Test the apply endpoint (without actually running Playwright)."""

    async def test_apply_unapproved_job_rejected(self, client, auth_headers, db_session, test_user):
        """Cannot apply to a job that isn't APPROVED."""
        job = Job(
            user_id=test_user.id,
            source_job_id="pending_apply_1",
            title="Pending Job",
            company="TestCo",
            status=JobStatus.PENDING,
            confidence_score=0.5,
            job_url="https://example.com/jobs/99999",
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        resp = await client.post(
            f"/api/applications/{job.id}/apply", headers=auth_headers
        )
        assert resp.status_code == 400
        assert "approved" in resp.json()["detail"].lower()
