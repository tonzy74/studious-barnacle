from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.criteria import SearchCriteria
from app.routers.auth import get_current_user
from app.security import InputSanitizer

router = APIRouter(prefix="/profile", tags=["profile"])


class CriteriaUpdateRequest(BaseModel):
    model_config = {"extra": "forbid"}

    target_titles: Optional[list[str]] = Field(None, max_length=50)
    min_salary_same_level: Optional[float] = None
    min_salary_step_up: Optional[float] = None
    location: Optional[str] = Field(None, max_length=200)
    max_office_days: Optional[int] = Field(None, ge=0, le=7)
    remote_ok: Optional[bool] = None
    hybrid_ok: Optional[bool] = None
    excluded_industries: Optional[list[str]] = Field(None, max_length=50)
    excluded_companies: Optional[list[str]] = Field(None, max_length=100)
    daily_batch_size: Optional[int] = Field(None, ge=1, le=50)

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

    @field_validator("excluded_industries", "excluded_companies", mode="before")
    @classmethod
    def sanitize_string_lists(cls, v):
        if v:
            return [InputSanitizer.sanitize_string(s) for s in v]
        return v


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
        "experience": profile_data.get("experience", []),
        "skills": profile_data.get("skills", []),
        "education": profile_data.get("education", []),
        "certifications": profile_data.get("certifications", []),
        "about": profile_data.get("about", ""),
        "picture": profile_data.get("picture", ""),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }


class ProfileUpdateRequest(BaseModel):
    model_config = {"extra": "forbid"}

    name: Optional[str] = Field(None, max_length=255)
    headline: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=255)
    skills: Optional[list[str]] = Field(None, max_length=100)
    experience: Optional[list[dict]] = None
    education: Optional[list[dict]] = None
    certifications: Optional[list[dict]] = None
    about: Optional[str] = Field(None, max_length=2000)
    phone: Optional[str] = Field(None, max_length=50)
    resume_path: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "headline", "location", "about", "phone", mode="before")
    @classmethod
    def sanitize_strings(cls, v):
        if v:
            return InputSanitizer.sanitize_string(v)
        return v

    @field_validator("skills", mode="before")
    @classmethod
    def sanitize_skill_list(cls, v):
        if v:
            return [InputSanitizer.sanitize_string(s) for s in v]
        return v


@router.put("/update")
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the user's profile information manually."""
    if data.name is not None:
        current_user.name = data.name
    if data.headline is not None:
        current_user.headline = data.headline
    if data.location is not None:
        current_user.location = data.location

    existing_data = current_user.profile_data or {}
    if data.skills is not None:
        existing_data["skills"] = data.skills
    if data.experience is not None:
        existing_data["experience"] = data.experience
    if data.education is not None:
        existing_data["education"] = data.education
    if data.certifications is not None:
        existing_data["certifications"] = data.certifications
    if data.about is not None:
        existing_data["about"] = data.about
    if data.phone is not None:
        existing_data["phone"] = data.phone
    if data.resume_path is not None:
        existing_data["resume_path"] = data.resume_path

    current_user.profile_data = existing_data

    await db.commit()
    await db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "profile": {
            "name": current_user.name,
            "headline": current_user.headline,
            "location": current_user.location,
            "skills_count": len(existing_data.get("skills", [])),
            "experience_count": len(existing_data.get("experience", [])),
        },
    }


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
