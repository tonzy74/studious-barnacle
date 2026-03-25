"""Arbeitnow job source provider.

Arbeitnow provides a free, no-auth-required JSON API for job listings.
Good for international and remote positions.
Docs: https://arbeitnow.com/api
"""
import logging

import httpx

from app.services.job_sources.base import JobSource, JobListing

logger = logging.getLogger(__name__)


class ArbeitnowSource(JobSource):
    """Job source using the Arbeitnow public API."""

    API_URL = "https://arbeitnow.com/api/job-board-api"

    @property
    def name(self) -> str:
        return "Arbeitnow"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    self.API_URL,
                    params={"page": page},
                    headers={"User-Agent": "LinkedInJobAgent/1.0"},
                )
                resp.raise_for_status()
                data = resp.json()

            title_keywords = {kw.lower() for title in titles for kw in title.split()}
            results = []

            for item in data.get("data", []):
                job_title = item.get("title", "")
                job_lower = job_title.lower()
                tags_lower = " ".join(t.lower() for t in item.get("tags", []))

                match = any(kw in job_lower or kw in tags_lower for kw in title_keywords)
                if not match:
                    continue

                is_remote = item.get("remote", False)
                if not remote_ok and is_remote:
                    continue

                remote_type = "remote" if is_remote else "onsite"

                results.append(JobListing(
                    source="arbeitnow",
                    source_id=str(item.get("slug", "")),
                    title=job_title,
                    company=item.get("company_name", ""),
                    location=item.get("location", ""),
                    description=item.get("description", ""),
                    remote_type=remote_type,
                    job_url=item.get("url", ""),
                    apply_url=item.get("url", ""),
                    tags=item.get("tags", []),
                    posted_date=item.get("created_at", ""),
                ))

            logger.info(f"Arbeitnow returned {len(results)} jobs")
            return results[:per_page]

        except httpx.HTTPError as e:
            logger.error(f"Arbeitnow API error: {e}")
            return []

    async def is_available(self) -> bool:
        return True
