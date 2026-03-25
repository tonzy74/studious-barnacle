from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.criteria import SearchCriteria
from app.routers.auth import get_current_user
from app.services.linkedin_scraper import LinkedInScraper

router = APIRouter(prefix="/profile", tags=["profile"])


class CriteriaUpdateRequest(BaseModel):
    target_titles: Optional[list[str]] = None
    min_salary_same_level: Optional[float] = None
    min_salary_step_up: Optional[float] = None
    location: Optional[str] = None
    max_office_days: Optional[int] = None
    remote_ok: Optional[bool] = None
    hybrid_ok: Optional[bool] = None
    excluded_industries: Optional[list[str]] = None
    excluded_companies: Optional[list[str]] = None
    daily_batch_size: Optional[int] = None


@router.get("")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile data from the database."""
    profile_data = current_user.profile_data or {}
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "headline": current_user.headline,
        "location": current_user.location,
        "linkedin_id": current_user.linkedin_id,
        "experience": profile_data.get("experience", []),
        "skills": profile_data.get("skills", []),
        "education": profile_data.get("education", []),
        "certifications": profile_data.get("certifications", []),
        "about": profile_data.get("about", ""),
        "picture": profile_data.get("picture", ""),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }


@router.post("/sync")
async def sync_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a Playwright scrape of the user's LinkedIn profile to update stored data."""
    profile_url = f"https://www.linkedin.com/in/{current_user.linkedin_id}/"

    scraper = LinkedInScraper()
    try:
        session_cookies = []
        if current_user.encrypted_session_token:
            from app.security import get_session_manager
            session_mgr = get_session_manager()
            session_data = session_mgr.decrypt_session_token(current_user.encrypted_session_token)
            if session_data:
                session_cookies = [
                    {
                        "name": "li_at",
                        "value": current_user.encrypted_session_token,
                        "domain": ".linkedin.com",
                        "path": "/",
                    }
                ]

        logged_in = await scraper.login_with_session(session_cookies)
        if not logged_in:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="LinkedIn session expired. Please re-authenticate.",
            )

        profile_data = await scraper.scrape_profile(profile_url)
        if not profile_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to scrape LinkedIn profile.",
            )

        existing_data = current_user.profile_data or {}
        existing_data.update(profile_data)
        current_user.profile_data = existing_data

        if profile_data.get("name"):
            current_user.name = profile_data["name"]
        if profile_data.get("headline"):
            current_user.headline = profile_data["headline"]
        if profile_data.get("location"):
            current_user.location = profile_data["location"]

        await db.commit()
        await db.refresh(current_user)

        return {
            "message": "Profile synced successfully",
            "profile": {
                "name": current_user.name,
                "headline": current_user.headline,
                "location": current_user.location,
                "skills_count": len(profile_data.get("skills", [])),
                "experience_count": len(profile_data.get("experience", [])),
            },
        }
    finally:
        await scraper.close()


@router.put("/criteria")
async def update_criteria(
    data: CriteriaUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the user's job search criteria."""
    result = await db.execute(
        select(SearchCriteria).where(SearchCriteria.user_id == current_user.id)
    )
    criteria = result.scalar_one_or_none()

    if criteria is None:
        criteria = SearchCriteria(user_id=current_user.id)
        db.add(criteria)

    if data.target_titles is not None:
        criteria.target_titles = data.target_titles
    if data.min_salary_same_level is not None:
        criteria.min_salary_same_level = data.min_salary_same_level
    if data.min_salary_step_up is not None:
        criteria.min_salary_step_up = data.min_salary_step_up
    if data.location is not None:
        criteria.location = data.location
    if data.max_office_days is not None:
        criteria.max_office_days = data.max_office_days
    if data.remote_ok is not None:
        criteria.remote_ok = data.remote_ok
    if data.hybrid_ok is not None:
        criteria.hybrid_ok = data.hybrid_ok
    if data.excluded_industries is not None:
        criteria.excluded_industries = data.excluded_industries
    if data.excluded_companies is not None:
        criteria.excluded_companies = data.excluded_companies
    if data.daily_batch_size is not None:
        criteria.daily_batch_size = max(1, min(50, data.daily_batch_size))

    await db.commit()
    await db.refresh(criteria)

    return {
        "message": "Criteria updated successfully",
        "criteria": {
            "target_titles": criteria.target_titles,
            "min_salary_same_level": criteria.min_salary_same_level,
            "min_salary_step_up": criteria.min_salary_step_up,
            "location": criteria.location,
            "max_office_days": criteria.max_office_days,
            "remote_ok": criteria.remote_ok,
            "hybrid_ok": criteria.hybrid_ok,
            "excluded_industries": criteria.excluded_industries,
            "excluded_companies": criteria.excluded_companies,
            "daily_batch_size": criteria.daily_batch_size,
        },
    }
