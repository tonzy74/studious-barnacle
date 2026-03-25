import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.job import Job, JobStatus
from app.routers.auth import get_current_user
from app.services.job_applier import JobApplier
from app.services.captcha_solver import CaptchaSolver
from app.security import RateLimitConfig

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("")
async def list_applications(
    status_filter: str = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all job applications with their current status."""
    applied_statuses = [
        JobStatus.APPROVED,
        JobStatus.APPLYING,
        JobStatus.APPLIED,
        JobStatus.VIEWED,
        JobStatus.RESPONSE,
        JobStatus.ERROR,
    ]

    query = select(Job).where(
        Job.user_id == current_user.id,
        Job.status.in_(applied_statuses),
    )

    if status_filter:
        try:
            filter_enum = JobStatus(status_filter)
            query = select(Job).where(
                Job.user_id == current_user.id,
                Job.status == filter_enum,
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status filter. Valid values: " + ", ".join(s.value for s in JobStatus),
            )

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar()

    query = query.order_by(Job.applied_at.desc().nullslast(), Job.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total else 0,
        "applications": [_serialize_application(job) for job in jobs],
    }


@router.post("/{job_id}/apply")
@limiter.limit(RateLimitConfig.APPLY_LIMIT)
async def apply_to_job(
    request: Request,
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger an automated application for an approved job."""
    settings = get_settings()

    today_start = datetime.combine(
        datetime.now(timezone.utc).date(), datetime.min.time()
    ).replace(tzinfo=timezone.utc)

    applied_today = await db.execute(
        select(func.count()).where(
            Job.user_id == current_user.id,
            Job.status == JobStatus.APPLIED,
            Job.applied_at >= today_start,
        )
    )
    count_today = applied_today.scalar()
    if count_today >= settings.MAX_DAILY_APPLICATIONS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily application limit ({settings.MAX_DAILY_APPLICATIONS}) reached. Try again tomorrow.",
        )

    result = await db.execute(
        select(Job)
        .where(Job.id == job_id, Job.user_id == current_user.id)
        .with_for_update()
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.status != JobStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job must be approved before applying. Current status: {job.status.value}",
        )

    job.status = JobStatus.APPLYING
    await db.commit()

    profile_data = current_user.profile_data or {}
    user_profile = {
        "name": current_user.name,
        "email": current_user.email,
        "headline": current_user.headline or "",
        "location": current_user.location or "",
        "oauth_id": current_user.oauth_id,
        "phone": profile_data.get("phone", ""),
        "skills": profile_data.get("skills", []),
        "experience": profile_data.get("experience", []),
        "resume_path": profile_data.get("resume_path", ""),
    }

    job_data = {
        "source_job_id": job.source_job_id,
        "title": job.title,
        "company": job.company,
        "job_url": job.job_url,
    }

    captcha_solver = None
    if settings.CAPTCHA_SERVICE_API_KEY:
        captcha_solver = CaptchaSolver(settings.CAPTCHA_SERVICE_API_KEY)

    applier = JobApplier(captcha_solver)

    try:
        apply_result = await applier.fill_application(job_data, user_profile)

        if apply_result["status"] == "applied":
            job.status = JobStatus.APPLIED
            job.applied_at = datetime.now(timezone.utc)
            job.error_message = None
        elif apply_result["status"] == "captcha_required":
            job.status = JobStatus.ERROR
            job.error_message = apply_result.get("message", "Captcha requires manual solving")
        else:
            job.status = JobStatus.ERROR
            job.error_message = apply_result.get("message", "Application failed")

        await db.commit()
        await db.refresh(job)

        return {
            "status": apply_result["status"],
            "message": apply_result.get("message", ""),
            "application": _serialize_application(job),
        }

    except Exception as e:
        job.status = JobStatus.ERROR
        job.error_message = "Application failed due to an internal error"
        await db.commit()
        logger.error(f"Application failed for job {job_id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application failed due to an internal error. Please try again later.",
        )
    finally:
        await applier.close()


@router.get("/{job_id}/status")
async def get_application_status(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current status of a specific job application."""
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return _serialize_application(job)


def _serialize_application(job: Job) -> dict:
    """Serialize a Job as an application entry."""
    score_breakdown = None
    if job.score_breakdown:
        try:
            score_breakdown = json.loads(job.score_breakdown)
        except json.JSONDecodeError:
            score_breakdown = None

    return {
        "id": job.id,
        "source_job_id": job.source_job_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "remote_type": job.remote_type.value if job.remote_type else "onsite",
        "confidence_score": job.confidence_score,
        "status": job.status.value if job.status else "pending",
        "score_breakdown": score_breakdown,
        "job_url": job.job_url,
        "applied_at": job.applied_at.isoformat() if job.applied_at else None,
        "error_message": "An error occurred during application." if job.error_message else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }
