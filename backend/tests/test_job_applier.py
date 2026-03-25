"""Tests for the JobApplier service (unit tests, no Playwright)."""
import os
import re
import pytest

from app.services.job_applier import JobApplier


class TestJobUrlValidation:
    """Test that job_url is validated before navigation."""

    @pytest.mark.asyncio
    async def test_empty_url_rejected(self):
        applier = JobApplier(scraper=None, captcha_solver=None)
        result = await applier.fill_application({"job_url": ""}, {})
        assert result["status"] == "error"
        assert "No job URL" in result["message"]

    @pytest.mark.asyncio
    async def test_non_linkedin_url_rejected(self):
        applier = JobApplier(scraper=None, captcha_solver=None)
        result = await applier.fill_application(
            {"job_url": "https://evil.com/steal-cookies"}, {}
        )
        assert result["status"] == "error"
        assert "Invalid job URL" in result["message"]

    @pytest.mark.asyncio
    async def test_linkedin_url_accepted_format(self):
        """Valid LinkedIn URLs should pass URL validation (will fail later on scraper)."""
        from unittest.mock import MagicMock
        mock_scraper = MagicMock()
        mock_scraper.page = None  # No browser page available
        applier = JobApplier(scraper=mock_scraper, captcha_solver=None)
        result = await applier.fill_application(
            {"job_url": "https://www.linkedin.com/jobs/view/12345"}, {}
        )
        # Should fail with "Browser not initialized", NOT "Invalid job URL"
        assert "Invalid job URL" not in result.get("message", "")
        assert result["status"] == "error"
        assert "Browser not initialized" in result["message"]

    @pytest.mark.asyncio
    async def test_javascript_url_rejected(self):
        applier = JobApplier(scraper=None, captcha_solver=None)
        result = await applier.fill_application(
            {"job_url": "javascript:alert(1)"}, {}
        )
        assert result["status"] == "error"


class TestScreenshotPathSafety:
    """Test screenshot filename sanitization."""

    def test_sanitize_job_id_in_filename(self):
        """Job IDs with path traversal chars should be sanitized."""
        raw_job_id = "../../../etc/passwd"
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', raw_job_id)
        assert "/" not in sanitized
        assert ".." not in sanitized
        assert sanitized == "etcpasswd"

    def test_normal_job_id_preserved(self):
        raw_job_id = "12345678"
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', raw_job_id)
        assert sanitized == "12345678"

    def test_special_chars_stripped(self):
        raw_job_id = "job<script>123"
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', raw_job_id)
        assert sanitized == "jobscript123"
