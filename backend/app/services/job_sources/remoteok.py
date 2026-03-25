"""RemoteOK job source provider.

RemoteOK is a remote-only job board with a free public JSON API.
No auth required. Rate limit: be reasonable (~1 req/sec).
Docs: https://remoteok.com/api
"""
import logging

import httpx

from app.services.job_sources.base import JobSource, JobListing

logger = logging.getLogger(__name__)


class RemoteOKSource(JobSource):
    """Job source using the RemoteOK public API."""

    API_URL = "https://remoteok.com/api"

    @property
    def name(self) -> str:
        return "RemoteOK"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        if not remote_ok:
            return []  # RemoteOK only has remote jobs

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    self.API_URL,
                    headers={"User-Agent": "LinkedInJobAgent/1.0"},
                )
                resp.raise_for_status()
                data = resp.json()

            # First item is metadata, skip it
            jobs_data = data[1:] if len(data) > 1 else []

            # Filter by title keywords
            title_keywords = {kw.lower() for title in titles for kw in title.split()}
            results = []

            for item in jobs_data:
                if not isinstance(item, dict):
                    continue

                job_title = item.get("position", "")
                job_tags = [t.lower() for t in item.get("tags", [])]
                job_lower = job_title.lower()

                # Check if any title keyword matches position or tags
                match = any(kw in job_lower or kw in " ".join(job_tags) for kw in title_keywords)
                if not match:
                    continue

                salary_text = item.get("salary", "")
                salary_min, salary_max = self._parse_salary(salary_text)

                results.append(JobListing(
                    source="remoteok",
                    source_id=str(item.get("id", "")),
                    title=job_title,
                    company=item.get("company", ""),
                    location=item.get("location", "Remote"),
                    description=item.get("description", ""),
                    salary_min=salary_min,
                    salary_max=salary_max,
                    remote_type="remote",
                    job_url=item.get("url", ""),
                    apply_url=item.get("apply_url", "") or item.get("url", ""),
                    tags=item.get("tags", []),
                    posted_date=item.get("date", ""),
                ))

            # Paginate locally
            start = (page - 1) * per_page
            paginated = results[start:start + per_page]

            logger.info(f"RemoteOK returned {len(paginated)} jobs (filtered from {len(results)} matches)")
            return paginated

        except httpx.HTTPError as e:
            logger.error(f"RemoteOK API error: {e}")
            return []

    async def is_available(self) -> bool:
        return True  # No auth needed

    @staticmethod
    def _parse_salary(salary_text: str) -> tuple[float | None, float | None]:
        """Parse salary string like '60000 - 90000' or '$120k - $150k'."""
        if not salary_text:
            return None, None
        import re
        numbers = re.findall(r'[\d,]+(?:\.\d+)?', salary_text.replace("k", "000").replace("K", "000"))
        if len(numbers) >= 2:
            return float(numbers[0].replace(",", "")), float(numbers[1].replace(",", ""))
        if len(numbers) == 1:
            val = float(numbers[0].replace(",", ""))
            return val, val
        return None, None
