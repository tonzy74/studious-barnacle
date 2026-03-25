import asyncio
import json
import logging
from datetime import datetime, timezone, date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, init_db
from app.models.user import User
from app.models.job import Job, JobStatus, RemoteType
from app.models.criteria import SearchCriteria
from app.services.job_aggregator import JobAggregator
from app.services.job_matcher import JobMatcher

logger = logging.getLogger(__name__)


class JobScheduler:
    """APScheduler-based daily job search and batch creation scheduler."""

    def __init__(self, run_hour: int = 6, run_minute: int = 0):
        self.scheduler = AsyncIOScheduler()
        self.run_hour = run_hour
        self.run_minute = run_minute
        self.matcher = JobMatcher()

    def start(self):
        """Start the scheduler with the daily job search task."""
        self.scheduler.add_job(
            self.run_daily_search,
            trigger=CronTrigger(hour=self.run_hour, minute=self.run_minute),
            id="daily_job_search",
            name="Daily Job Search",
            replace_existing=True,
            misfire_grace_time=3600,
        )
        self.scheduler.start()
        logger.info(
            f"Job scheduler started. Daily search runs at {self.run_hour:02d}:{self.run_minute:02d} UTC"
        )

    def stop(self):
        """Stop the scheduler gracefully."""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Job scheduler stopped.")

    async def run_daily_search(self):
        """Execute daily job search for all active users."""
        logger.info("Starting daily job search...")

        if async_session_factory is None:
            await init_db()

        async with async_session_factory() as session:
            try:
                result = await session.execute(
                    select(User).where(User.encrypted_session_token.isnot(None))
                )
                users = result.scalars().all()
                logger.info(f"Found {len(users)} active users for daily search.")

                for user in users:
                    try:
                        await self._process_user(session, user)
                    except Exception as e:
                        logger.error(
                            f"Error processing daily search for user {user.id}: {e}"
                        )
                        continue

                await session.commit()
                logger.info("Daily job search completed successfully.")

            except Exception as e:
                logger.error(f"Daily search failed: {e}")
                await session.rollback()

    async def _process_user(self, session: AsyncSession, user: User):
        """Process daily job search for a single user."""
        criteria_result = await session.execute(
            select(SearchCriteria).where(SearchCriteria.user_id == user.id)
        )
        criteria = criteria_result.scalar_one_or_none()

        if not criteria:
            logger.info(f"No search criteria set for user {user.id}, skipping.")
            return

        if not criteria.target_titles:
            logger.info(f"No target titles for user {user.id}, skipping.")
            return

        criteria_dict = {
            "target_titles": criteria.target_titles or [],
            "min_salary_same_level": criteria.min_salary_same_level,
            "min_salary_step_up": criteria.min_salary_step_up,
            "location": criteria.location or user.location or "",
            "max_office_days": criteria.max_office_days,
            "remote_ok": criteria.remote_ok,
            "hybrid_ok": criteria.hybrid_ok,
            "excluded_industries": criteria.excluded_industries or [],
            "excluded_companies": criteria.excluded_companies or [],
            "daily_batch_size": criteria.daily_batch_size or 10,
        }

        profile_data = user.profile_data or {}
        profile_dict = {
            "name": user.name,
            "email": user.email,
            "headline": user.headline or "",
            "location": user.location or "",
            "oauth_id": user.oauth_id,
            "skills": profile_data.get("skills", []),
            "experience": profile_data.get("experience", []),
            "education": profile_data.get("education", []),
            "certifications": profile_data.get("certifications", []),
        }

        aggregator = JobAggregator()
        listings = await aggregator.search(
            titles=criteria_dict["target_titles"],
            location=criteria_dict["location"],
            remote_ok=criteria_dict["remote_ok"],
        )
        logger.info(
            f"Found {len(listings)} raw jobs for user {user.id}."
        )

        raw_jobs = []
        for listing in listings:
            raw_jobs.append({
                "source_job_id": listing.source_job_id,
                "title": listing.title,
                "company": listing.company,
                "location": listing.location,
                "description": listing.description,
                "requirements": listing.requirements,
                "salary_min": listing.salary_min,
                "salary_max": listing.salary_max,
                "remote_type": listing.remote_type,
                "job_url": listing.apply_url or listing.job_url,
            })

        scored_jobs = self.score_and_filter(raw_jobs, criteria_dict, profile_dict)
        await self.create_daily_batch(session, user.id, scored_jobs, criteria_dict["daily_batch_size"])
        await self.send_notification(user.id, len(scored_jobs))

    def score_and_filter(
        self, jobs: list[dict], criteria: dict, profile: dict
    ) -> list[dict]:
        """Run the matching engine on scraped jobs and filter by criteria."""
        ranked = self.matcher.rank_jobs(jobs, profile, criteria)

        filtered = []
        for job in ranked:
            if job.get("confidence_score", 0) < 20:
                continue
            filtered.append(job)

        return filtered

    async def create_daily_batch(
        self,
        session: AsyncSession,
        user_id: int,
        jobs: list[dict],
        batch_size: int,
    ):
        """Store the top N scored jobs as today's batch for a user."""
        top_jobs = jobs[:batch_size]
        created_count = 0

        for job_data in top_jobs:
            existing = await session.execute(
                select(Job).where(
                    Job.user_id == user_id,
                    Job.source_job_id == job_data.get("source_job_id", ""),
                )
            )
            if existing.scalar_one_or_none():
                continue

            remote_type_str = job_data.get("remote_type", "onsite").lower()
            try:
                remote_type = RemoteType(remote_type_str)
            except ValueError:
                remote_type = RemoteType.ONSITE

            score_breakdown = job_data.get("score_breakdown", {})

            new_job = Job(
                user_id=user_id,
                source_job_id=job_data.get("source_job_id", ""),
                title=job_data.get("title", ""),
                company=job_data.get("company", ""),
                location=job_data.get("location", ""),
                salary_min=job_data.get("salary_min"),
                salary_max=job_data.get("salary_max"),
                remote_type=remote_type,
                description=job_data.get("description", ""),
                requirements=job_data.get("requirements", ""),
                confidence_score=job_data.get("confidence_score", 0.0),
                status=JobStatus.PENDING,
                score_breakdown=json.dumps(score_breakdown) if score_breakdown else None,
                job_url=job_data.get("job_url", ""),
            )
            session.add(new_job)
            created_count += 1

        logger.info(
            f"Created {created_count} new jobs in daily batch for user {user_id}."
        )

    async def send_notification(self, user_id: int, job_count: int):
        """Send an in-app notification about new daily jobs."""
        logger.info(
            f"Notification: User {user_id} has {job_count} new jobs in today's batch."
        )
