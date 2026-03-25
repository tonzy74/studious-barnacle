"""Tests for job source providers and aggregator."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.job_sources.base import JobListing, JobSource
from app.services.job_sources.remoteok import RemoteOKSource
from app.services.job_sources.arbeitnow import ArbeitnowSource
from app.services.job_sources.themuse import TheMuseSource
from app.services.job_aggregator import JobAggregator


class TestJobListing:
    """Test the standardized JobListing dataclass."""

    def test_source_job_id_format(self):
        listing = JobListing(
            source="remoteok",
            source_id="12345",
            title="Software Engineer",
            company="TestCo",
        )
        assert listing.source_job_id == "remoteok_12345"

    def test_default_values(self):
        listing = JobListing(
            source="test", source_id="1", title="Test", company="Co"
        )
        assert listing.location == ""
        assert listing.salary_min is None
        assert listing.salary_max is None
        assert listing.remote_type == "onsite"
        assert listing.tags == []


class TestRemoteOKSource:
    """Test RemoteOK provider."""

    @pytest.mark.asyncio
    async def test_is_available(self):
        source = RemoteOKSource()
        assert await source.is_available() is True

    @pytest.mark.asyncio
    async def test_name(self):
        assert RemoteOKSource().name == "RemoteOK"

    @pytest.mark.asyncio
    async def test_skips_non_remote(self):
        source = RemoteOKSource()
        result = await source.search(["engineer"], remote_ok=False)
        assert result == []

    @pytest.mark.asyncio
    async def test_parse_salary(self):
        assert RemoteOKSource._parse_salary("60000 - 90000") == (60000.0, 90000.0)
        assert RemoteOKSource._parse_salary("$120k - $150k") == (120000.0, 150000.0)
        assert RemoteOKSource._parse_salary("") == (None, None)
        assert RemoteOKSource._parse_salary("100000") == (100000.0, 100000.0)

    @pytest.mark.asyncio
    async def test_search_handles_api_error(self):
        source = RemoteOKSource()
        import httpx as _httpx
        with patch("httpx.AsyncClient.__aenter__") as mock_client:
            mock_client.return_value.get = AsyncMock(
                side_effect=_httpx.ConnectError("Network error")
            )
            result = await source.search(["engineer"])
            assert result == []


class TestArbeitnowSource:
    """Test Arbeitnow provider."""

    @pytest.mark.asyncio
    async def test_is_available(self):
        assert await ArbeitnowSource().is_available() is True

    @pytest.mark.asyncio
    async def test_name(self):
        assert ArbeitnowSource().name == "Arbeitnow"


class TestTheMuseSource:
    """Test The Muse provider."""

    @pytest.mark.asyncio
    async def test_is_available(self):
        assert await TheMuseSource().is_available() is True

    @pytest.mark.asyncio
    async def test_name(self):
        assert TheMuseSource().name == "The Muse"


class TestJobAggregator:
    """Test the aggregation service."""

    @pytest.mark.asyncio
    async def test_deduplicate(self):
        aggregator = JobAggregator(sources=[])
        listings = [
            JobListing(source="a", source_id="1", title="Software Engineer", company="TestCo"),
            JobListing(source="b", source_id="2", title="Software Engineer", company="TestCo"),
            JobListing(source="c", source_id="3", title="Backend Developer", company="OtherCo"),
        ]
        deduped = aggregator._deduplicate(listings)
        assert len(deduped) == 2

    @pytest.mark.asyncio
    async def test_search_with_mock_sources(self):
        """Test aggregator with mock sources that return canned data."""
        mock_source1 = AsyncMock(spec=JobSource)
        mock_source1.name = "MockSource1"
        mock_source1.is_available = AsyncMock(return_value=True)
        mock_source1.search = AsyncMock(return_value=[
            JobListing(source="mock1", source_id="1", title="Engineer", company="Co1"),
        ])

        mock_source2 = AsyncMock(spec=JobSource)
        mock_source2.name = "MockSource2"
        mock_source2.is_available = AsyncMock(return_value=True)
        mock_source2.search = AsyncMock(return_value=[
            JobListing(source="mock2", source_id="2", title="Developer", company="Co2"),
        ])

        aggregator = JobAggregator(sources=[mock_source1, mock_source2])
        results = await aggregator.search(["engineer"])

        assert len(results) == 2
        mock_source1.search.assert_called_once()
        mock_source2.search.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_handles_source_failure(self):
        """If one source fails, others should still return results."""
        good_source = AsyncMock(spec=JobSource)
        good_source.name = "GoodSource"
        good_source.is_available = AsyncMock(return_value=True)
        good_source.search = AsyncMock(return_value=[
            JobListing(source="good", source_id="1", title="Engineer", company="Co"),
        ])

        bad_source = AsyncMock(spec=JobSource)
        bad_source.name = "BadSource"
        bad_source.is_available = AsyncMock(return_value=True)
        bad_source.search = AsyncMock(side_effect=Exception("API down"))

        aggregator = JobAggregator(sources=[good_source, bad_source])
        results = await aggregator.search(["engineer"])

        assert len(results) == 1
        assert results[0].source == "good"

    @pytest.mark.asyncio
    async def test_search_skips_unavailable_sources(self):
        available = AsyncMock(spec=JobSource)
        available.name = "Available"
        available.is_available = AsyncMock(return_value=True)
        available.search = AsyncMock(return_value=[
            JobListing(source="avail", source_id="1", title="Job", company="Co"),
        ])

        unavailable = AsyncMock(spec=JobSource)
        unavailable.name = "Unavailable"
        unavailable.is_available = AsyncMock(return_value=False)
        unavailable.search = AsyncMock()

        aggregator = JobAggregator(sources=[available, unavailable])
        results = await aggregator.search(["engineer"])

        assert len(results) == 1
        unavailable.search.assert_not_called()

    @pytest.mark.asyncio
    async def test_source_names(self):
        mock_source = AsyncMock(spec=JobSource)
        mock_source.name = "TestSource"
        aggregator = JobAggregator(sources=[mock_source])
        assert aggregator.source_names == ["TestSource"]

    @pytest.mark.asyncio
    async def test_no_sources_returns_empty(self):
        aggregator = JobAggregator(sources=[])
        results = await aggregator.search(["engineer"])
        assert results == []
