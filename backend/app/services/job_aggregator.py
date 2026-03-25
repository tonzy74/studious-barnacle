"""Job aggregation service that searches multiple sources concurrently."""
import asyncio
import logging
from typing import Optional

from app.services.job_sources.base import JobSource, JobListing
from app.services.job_sources.adzuna import AdzunaSource
from app.services.job_sources.remoteok import RemoteOKSource
from app.services.job_sources.arbeitnow import ArbeitnowSource
from app.services.job_sources.themuse import TheMuseSource
from app.services.job_sources.jsearch import JSearchSource
from app.config import get_settings

logger = logging.getLogger(__name__)


class JobAggregator:
    """Searches multiple job sources concurrently and deduplicates results."""

    def __init__(self, sources: Optional[list[JobSource]] = None):
        if sources is not None:
            self._sources = sources
        else:
            self._sources = self._build_sources()

    def _build_sources(self) -> list[JobSource]:
        """Build job sources from environment config."""
        settings = get_settings()
        sources: list[JobSource] = []

        # Always add free, no-auth sources
        sources.append(RemoteOKSource())
        sources.append(ArbeitnowSource())
        sources.append(TheMuseSource())

        # Add API-key sources if configured
        adzuna_id = getattr(settings, "ADZUNA_APP_ID", "")
        adzuna_key = getattr(settings, "ADZUNA_APP_KEY", "")
        if adzuna_id and adzuna_key:
            sources.append(AdzunaSource(adzuna_id, adzuna_key))

        jsearch_key = getattr(settings, "JSEARCH_API_KEY", "")
        if jsearch_key:
            sources.append(JSearchSource(jsearch_key))

        return sources

    @property
    def source_names(self) -> list[str]:
        return [s.name for s in self._sources]

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        per_page: int = 25,
    ) -> list[JobListing]:
        """Search all available sources concurrently and return merged results."""
        available = []
        for source in self._sources:
            try:
                if await source.is_available():
                    available.append(source)
            except Exception as e:
                logger.warning(f"Source {source.name} availability check failed: {e}")

        if not available:
            logger.warning("No job sources available")
            return []

        logger.info(f"Searching {len(available)} sources: {[s.name for s in available]}")

        tasks = [
            self._search_source(source, titles, location, remote_ok, per_page)
            for source in available
        ]

        results_per_source = await asyncio.gather(*tasks, return_exceptions=True)

        all_listings: list[JobListing] = []
        for source, result in zip(available, results_per_source):
            if isinstance(result, Exception):
                logger.error(f"Source {source.name} failed: {result}")
                continue
            all_listings.extend(result)
            logger.info(f"  {source.name}: {len(result)} jobs")

        deduped = self._deduplicate(all_listings)
        logger.info(f"Total: {len(all_listings)} raw -> {len(deduped)} deduplicated")
        return deduped

    async def _search_source(
        self,
        source: JobSource,
        titles: list[str],
        location: str,
        remote_ok: bool,
        per_page: int,
    ) -> list[JobListing]:
        """Search a single source with timeout protection."""
        try:
            return await asyncio.wait_for(
                source.search(titles, location, remote_ok, per_page=per_page),
                timeout=20.0,
            )
        except asyncio.TimeoutError:
            logger.warning(f"Source {source.name} timed out")
            return []

    def _deduplicate(self, listings: list[JobListing]) -> list[JobListing]:
        """Remove duplicate jobs based on normalized title + company."""
        seen: dict[str, JobListing] = {}
        for listing in listings:
            key = f"{listing.title.lower().strip()}|{listing.company.lower().strip()}"
            if key not in seen:
                seen[key] = listing
        return list(seen.values())
