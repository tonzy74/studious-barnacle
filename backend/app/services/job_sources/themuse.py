"""The Muse job source provider.

The Muse provides a free, no-auth-required public API with detailed company info.
Docs: https://www.themuse.com/developers/api/v2
"""
import logging

import httpx

from app.services.job_sources.base import JobSource, JobListing

logger = logging.getLogger(__name__)


class TheMuseSource(JobSource):
    """Job source using The Muse public API."""

    API_URL = "https://www.themuse.com/api/public/jobs"

    @property
    def name(self) -> str:
        return "The Muse"

    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        # The Muse uses 0-indexed pages
        params: dict = {"page": page - 1}

        # The Muse uses category-based filtering
        # Map common title keywords to their categories
        category_map = {
            "software": "Software Engineering",
            "engineer": "Software Engineering",
            "developer": "Software Engineering",
            "data": "Data Science",
            "product": "Product",
            "design": "Design",
            "marketing": "Marketing",
            "sales": "Sales",
            "finance": "Finance",
            "operations": "Operations",
            "hr": "Human Resources",
            "project": "Project Management",
        }

        categories = set()
        for title in titles:
            for keyword, category in category_map.items():
                if keyword in title.lower():
                    categories.add(category)

        if categories:
            params["category"] = list(categories)

        if location:
            params["location"] = location
        if remote_ok:
            params["location"] = params.get("location", "") or "Flexible / Remote"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(self.API_URL, params=params)
                resp.raise_for_status()
                data = resp.json()

            results = []
            for item in data.get("results", []):
                locations = item.get("locations", [])
                loc_str = ", ".join(l.get("name", "") for l in locations) if locations else ""

                remote_type = "onsite"
                if any("remote" in l.get("name", "").lower() or "flexible" in l.get("name", "").lower() for l in locations):
                    remote_type = "remote"

                company = item.get("company", {})
                company_name = company.get("name", "") if isinstance(company, dict) else ""

                categories_list = [c.get("name", "") for c in item.get("categories", []) if isinstance(c, dict)]

                results.append(JobListing(
                    source="themuse",
                    source_id=str(item.get("id", "")),
                    title=item.get("name", ""),
                    company=company_name,
                    location=loc_str,
                    description=item.get("contents", ""),
                    remote_type=remote_type,
                    job_url=item.get("refs", {}).get("landing_page", ""),
                    apply_url=item.get("refs", {}).get("landing_page", ""),
                    tags=categories_list,
                    posted_date=item.get("publication_date", ""),
                ))

            logger.info(f"The Muse returned {len(results)} jobs")
            return results[:per_page]

        except httpx.HTTPError as e:
            logger.error(f"The Muse API error: {e}")
            return []

    async def is_available(self) -> bool:
        return True
