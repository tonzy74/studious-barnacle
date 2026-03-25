"""Adzuna job source provider.

Adzuna aggregates jobs from thousands of boards and company sites.
Free tier: 250 requests/day.
Docs: https://developer.adzuna.com/
"""
import logging
from typing import Optional

import httpx

from app.services.job_sources.base import JobSource, JobListing

logger = logging.getLogger(__name__)


class AdzunaSource(JobSource):
    """Job source using the Adzuna API."""

    BASE_URL = "https://api.adzuna.com/v1/api/jobs"

    def __init__(self, app_id: str, app_key: str, country: str = "us"):
        self.app_id = app_id
        self.app_key = app_key
        self.country = country

    @property
    def name(self) -> str:
        return "Adzuna"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        query = " OR ".join(f'"{t}"' for t in titles)

        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": query,
            "results_per_page": min(per_page, 50),
            "page": page,
            "content-type": "application/json",
        }
        if location:
            params["where"] = location
        if remote_ok:
            params["what"] = f"{query} remote"

        url = f"{self.BASE_URL}/{self.country}/search/{page}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

            results = []
            for item in data.get("results", []):
                salary_min = item.get("salary_min")
                salary_max = item.get("salary_max")

                location_str = item.get("location", {}).get("display_name", "")
                title_str = item.get("title", "")
                desc = item.get("description", "")

                remote_type = "onsite"
                lower_title = title_str.lower()
                lower_loc = location_str.lower()
                if "remote" in lower_title or "remote" in lower_loc:
                    remote_type = "remote"
                elif "hybrid" in lower_title or "hybrid" in lower_loc:
                    remote_type = "hybrid"

                results.append(JobListing(
                    source="adzuna",
                    source_id=str(item.get("id", "")),
                    title=title_str,
                    company=item.get("company", {}).get("display_name", ""),
                    location=location_str,
                    description=desc,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    remote_type=remote_type,
                    job_url=item.get("redirect_url", ""),
                    apply_url=item.get("redirect_url", ""),
                    posted_date=item.get("created", ""),
                ))

            logger.info(f"Adzuna returned {len(results)} jobs for query: {query[:50]}")
            return results

        except httpx.HTTPError as e:
            logger.error(f"Adzuna API error: {e}")
            return []

    async def is_available(self) -> bool:
        return bool(self.app_id and self.app_key)
