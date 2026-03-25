"""Abstract base class for all job source providers."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class JobListing:
    """Standardized job listing from any source."""

    source: str  # e.g. "remoteok", "arbeitnow", "themuse"
    source_id: str  # unique ID from the source
    title: str
    company: str
    location: str = ""
    description: str = ""
    requirements: str = ""
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    remote_type: str = "onsite"  # remote, hybrid, onsite
    job_url: str = ""
    apply_url: str = ""  # direct application URL (may differ from job_url)
    tags: list[str] = field(default_factory=list)
    posted_date: Optional[str] = None

    @property
    def source_job_id(self) -> str:
        """Composite ID for the Job model."""
        return f"{self.source}_{self.source_id}"


class JobSource(ABC):
    """Abstract base class for job source providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this job source."""
        ...

    @abstractmethod
    async def search(
        self,
        titles: list[str],
        location: str = "",
        remote_ok: bool = True,
        page: int = 1,
        per_page: int = 25,
    ) -> list[JobListing]:
        """Search for jobs matching the given criteria.

        Args:
            titles: Target job titles to search for.
            location: Preferred location string.
            remote_ok: Whether to include remote jobs.
            page: Page number for pagination.
            per_page: Results per page.

        Returns:
            List of standardized JobListing objects.
        """
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if this source is configured and reachable."""
        ...
