import json
from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.user import User
from app.models.job import Job, JobStatus
from app.models.criteria import SearchCriteria
from app.routers.auth import get_current_user
from app.services.linkedin_scraper import LinkedInScraper
from app.services.job_matcher import JobMatcher
from app.security import RateLimitConfig, InputSanitizer

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/jobs", tags=["jobs"])


class SearchRequest(BaseModel):
    model_config = {"extra": "forbid"}

    target_titles: Optional[list[str]] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=200)
    remote_ok: Optional[bool] = True

    @field_validator("target_titles", mode="before")
    @classmethod
    def sanitize_titles(cls, v):
        if v:
            return [InputSanitizer.sanitize_string(t) for t in v]
        return v

    @field_validator("location", mode="before")
    @classmethod
    def sanitize_location(cls, v):
        if v:
            return InputSanitizer.sanitize_string(v)
        return v


@router.get("/daily")
async def get_daily_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get today's job batch for the authenticated user."""
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(
        tzinfo=timezone.utc
    )

    result = await db.execute(
        select(Job)
        .where(
            and_(
                Job.user_id == current_user.id,
                Job.created_at >= today_start,
            )
        )
        .order_by(Job.confidence_score.desc())
    )
    jobs = result.scalars().all()

    return {
        "date": date.today().isoformat(),
        "count": len(jobs),
        "jobs": [_serialize_job(job) for job in jobs],
    }


@router.post("/{job_id}/approve")
async def approve_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a job for application."""
    job = await _get_user_job(db, job_id, current_user.id)

    if job.status not in (JobStatus.PENDING, JobStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve a job with status '{job.status.value}'",
        )

    job.status = JobStatus.APPROVED
    await db.commit()
    await db.refresh(job)

    return {"message": "Job approved", "job": _serialize_job(job)}


@router.post("/{job_id}/reject")
async def reject_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a job from the daily batch."""
    job = await _get_user_job(db, job_id, current_user.id)

    if job.status not in (JobStatus.PENDING, JobStatus.APPROVED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject a job with status '{job.status.value}'",
        )

    job.status = JobStatus.REJECTED
    await db.commit()
    await db.refresh(job)

    return {"message": "Job rejected", "job": _serialize_job(job)}


@router.post("/search")
@limiter.limit(RateLimitConfig.SEARCH_LIMIT)
async def trigger_job_search(
    request: Request,
    data: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a manual job search using provided or saved criteria."""
    criteria_result = await db.execute(
        select(SearchCriteria).where(SearchCriteria.user_id == current_user.id)
    )
    saved_criteria = criteria_result.scalar_one_or_none()

    search_criteria = {
        "target_titles": data.target_titles or (saved_criteria.target_titles if saved_criteria else []),
        "location": data.location or (saved_criteria.location if saved_criteria else "") or current_user.location or "",
        "remote_ok": data.remote_ok if data.remote_ok is not None else (saved_criteria.remote_ok if saved_criteria else True),
        "hybrid_ok": saved_criteria.hybrid_ok if saved_criteria else True,
        "max_office_days": saved_criteria.max_office_days if saved_criteria else 5,
        "min_salary_same_level": saved_criteria.min_salary_same_level if saved_criteria else None,
        "min_salary_step_up": saved_criteria.min_salary_step_up if saved_criteria else None,
        "excluded_companies": saved_criteria.excluded_companies if saved_criteria else [],
        "excluded_industries": saved_criteria.excluded_industries if saved_criteria else [],
        "daily_batch_size": saved_criteria.daily_batch_size if saved_criteria else 10,
    }

    if not search_criteria["target_titles"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target titles specified. Set search criteria first.",
        )

    profile_data = current_user.profile_data or {}
    profile_dict = {
        "name": current_user.name,
        "email": current_user.email,
        "headline": current_user.headline or "",
        "location": current_user.location or "",
        "linkedin_id": current_user.linkedin_id,
        "skills": profile_data.get("skills", []),
        "experience": profile_data.get("experience", []),
    }

    scraper = LinkedInScraper()
    matcher = JobMatcher()
    try:
        raw_jobs = await scraper.search_jobs(search_criteria)

        for raw_job in raw_jobs:
            job_url = raw_job.get("job_url", "")
            if job_url:
                details = await scraper.get_job_details(job_url)
                if details:
                    raw_job.update(details)

        scored_jobs = matcher.rank_jobs(raw_jobs, profile_dict, search_criteria)

        batch_size = search_criteria["daily_batch_size"]
        top_jobs = scored_jobs[:batch_size]

        created_jobs = []
        for job_data in top_jobs:
            existing = await db.execute(
                select(Job).where(
                    Job.user_id == current_user.id,
                    Job.linkedin_job_id == job_data.get("linkedin_job_id", ""),
                )
            )
            if existing.scalar_one_or_none():
                continue

            from app.models.job import RemoteType
            remote_str = job_data.get("remote_type", "onsite").lower()
            try:
                remote_type = RemoteType(remote_str)
            except ValueError:
                remote_type = RemoteType.ONSITE

            score_breakdown = job_data.get("score_breakdown", {})
            new_job = Job(
                user_id=current_user.id,
                linkedin_job_id=job_data.get("linkedin_job_id", ""),
                title=job_data.get("title", ""),
                company=job_data.get("company", ""),
                location=job_data.get("location", ""),
                salary_min=job_data.get("salary_min"),
                salary_max=job_data.get("salary_max"),
                remote_type=remote_type,
                description=job_data.get("description", ""),
                requirements=job_data.get("requirements", ""),
                confidence_score=job_data.get("confidence_score", 0.0),
                linkedin_match_score=job_data.get("linkedin_match_score"),
                status=JobStatus.PENDING,
                score_breakdown=json.dumps(score_breakdown) if score_breakdown else None,
                job_url=job_data.get("job_url", ""),
            )
            db.add(new_job)
            created_jobs.append(new_job)

        await db.commit()

        for job in created_jobs:
            await db.refresh(job)

        return {
            "message": f"Found {len(scored_jobs)} matches, added {len(created_jobs)} new jobs",
            "total_found": len(raw_jobs),
            "total_scored": len(scored_jobs),
            "new_jobs_added": len(created_jobs),
            "jobs": [_serialize_job(j) for j in created_jobs],
        }
    finally:
        await scraper.close()


@router.get("/history")
async def get_job_history(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get job history with optional status filter and pagination."""
    query = select(Job).where(Job.user_id == current_user.id)

    if status_filter:
        try:
            status_enum = JobStatus(status_filter)
            query = query.where(Job.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status filter. Valid values: " + ", ".join(s.value for s in JobStatus),
            )

    count_result = await db.execute(
        select(func.count()).select_from(
            query.subquery()
        )
    )
    total = count_result.scalar()

    query = query.order_by(Job.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total else 0,
        "jobs": [_serialize_job(job) for job in jobs],
    }


async def _get_user_job(db: AsyncSession, job_id: int, user_id: int) -> Job:
    """Helper to fetch a job belonging to the current user."""
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


def _serialize_job(job: Job) -> dict:
    """Serialize a Job model to a dictionary."""
    score_breakdown = None
    if job.score_breakdown:
        try:
            score_breakdown = json.loads(job.score_breakdown)
        except json.JSONDecodeError:
            score_breakdown = None

    return {
        "id": job.id,
        "linkedin_job_id": job.linkedin_job_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "remote_type": job.remote_type.value if job.remote_type else "onsite",
        "description": job.description,
        "requirements": job.requirements,
        "confidence_score": job.confidence_score,
        "linkedin_match_score": job.linkedin_match_score,
        "status": job.status.value if job.status else "pending",
        "score_breakdown": score_breakdown,
        "job_url": job.job_url,
        "applied_at": job.applied_at.isoformat() if job.applied_at else None,
        "error_message": "An error occurred during application." if job.error_message else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }
