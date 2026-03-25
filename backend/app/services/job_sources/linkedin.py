"""LinkedIn job source — wraps the existing LinkedIn scraper.

This provider is left as-is per user request. It uses Playwright
to scrape LinkedIn directly. Use at your own risk regarding TOS.
"""
import logging
from typing import Optional

from app.services.job_sources.base import JobSource, JobListing
from app.services.linkedin_scraper import LinkedInScraper

logger = logging.getLogger(__name__)


class LinkedInSource(JobSource):
    """Job source wrapping the existing LinkedIn Playwright scraper."""

    def __init__(self, scraper: Optional[LinkedInScraper] = None):
        self._scraper = scraper

    @property
    def name(self) -> str:
        return "LinkedIn"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        if not self._scraper:
            return []

        criteria = {
            "target_titles": titles,
            "location": location,
            "remote_ok": remote_ok,
        }

        try:
            raw_jobs = await self._scraper.search_jobs(criteria)
            results = []
            for item in raw_jobs:
                job_url = item.get("job_url", "")
                if job_url:
                    details = await self._scraper.get_job_details(job_url)
                    if details:
                        item.update(details)

                remote_type = item.get("remote_type", "onsite")
                results.append(JobListing(
                    source="linkedin",
                    source_id=item.get("linkedin_job_id", ""),
                    title=item.get("title", ""),
                    company=item.get("company", ""),
                    location=item.get("location", ""),
                    description=item.get("description", ""),
                    requirements=item.get("requirements", ""),
                    salary_min=item.get("salary_min"),
                    salary_max=item.get("salary_max"),
                    remote_type=remote_type,
                    job_url=job_url,
                    apply_url=job_url,
                    posted_date=item.get("posted_date", ""),
                ))

            start = (page - 1) * per_page
            return results[start:start + per_page]

        except Exception as e:
            logger.error(f"LinkedIn scraper error: {e}")
            return []

    async def is_available(self) -> bool:
        return self._scraper is not None
