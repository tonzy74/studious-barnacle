"""JSearch (RapidAPI) job source provider.

JSearch aggregates from Google Jobs, LinkedIn, Indeed, Glassdoor, etc.
Requires a RapidAPI key. Free tier: 200 requests/month.
Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
"""
import logging

import httpx

from app.services.job_sources.base import JobSource, JobListing

logger = logging.getLogger(__name__)


class JSearchSource(JobSource):
    """Job source using the JSearch API via RapidAPI."""

    API_URL = "https://jsearch.p.rapidapi.com/search"
    HOST = "jsearch.p.rapidapi.com"

    def __init__(self, api_key: str):
        self.api_key = api_key

    @property
    def name(self) -> str:
        return "JSearch"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        query = " OR ".join(titles)
        if location:
            query += f" in {location}"

        params = {
            "query": query,
            "page": str(page),
            "num_pages": "1",
        }
        if remote_ok:
            params["remote_jobs_only"] = "true"

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.HOST,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(self.API_URL, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            results = []
            for item in data.get("data", []):
                salary_min = item.get("job_min_salary")
                salary_max = item.get("job_max_salary")

                remote_type = "onsite"
                if item.get("job_is_remote"):
                    remote_type = "remote"

                description = item.get("job_description", "")
                qualifications = item.get("job_highlights", {})
                req_items = qualifications.get("Qualifications", []) if isinstance(qualifications, dict) else []
                requirements = "\n".join(req_items) if req_items else ""

                results.append(JobListing(
                    source="jsearch",
                    source_id=item.get("job_id", ""),
                    title=item.get("job_title", ""),
                    company=item.get("employer_name", ""),
                    location=f"{item.get('job_city', '')}, {item.get('job_state', '')}".strip(", "),
                    description=description,
                    requirements=requirements,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    remote_type=remote_type,
                    job_url=item.get("job_apply_link", "") or item.get("job_google_link", ""),
                    apply_url=item.get("job_apply_link", ""),
                    posted_date=item.get("job_posted_at_datetime_utc", ""),
                ))

            logger.info(f"JSearch returned {len(results)} jobs for query: {query[:50]}")
            return results[:per_page]

        except httpx.HTTPError as e:
            logger.error(f"JSearch API error: {e}")
            return []

    async def is_available(self) -> bool:
        return bool(self.api_key)
