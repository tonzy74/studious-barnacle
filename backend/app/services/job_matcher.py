import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

TITLE_SYNONYMS = {
    "software engineer": [
        "software developer", "backend engineer", "frontend engineer",
        "full stack engineer", "full-stack developer", "sde", "swe",
        "application developer", "platform engineer",
    ],
    "data scientist": [
        "data analyst", "machine learning engineer", "ml engineer",
        "research scientist", "data engineer", "ai engineer",
    ],
    "product manager": [
        "program manager", "project manager", "technical program manager",
        "product owner", "product lead",
    ],
    "designer": [
        "ux designer", "ui designer", "product designer", "visual designer",
        "interaction designer", "ux/ui designer",
    ],
    "devops engineer": [
        "site reliability engineer", "sre", "infrastructure engineer",
        "cloud engineer", "platform engineer", "systems engineer",
    ],
}

STEP_UP_TITLES = {
    "junior": ["mid", ""],
    "mid": ["senior", "lead"],
    "senior": ["staff", "principal", "lead", "manager"],
    "staff": ["principal", "director"],
    "lead": ["manager", "director", "head"],
    "manager": ["senior manager", "director", "head", "vp"],
}


class JobMatcher:
    """Matching engine that calculates confidence scores for job matches."""

    WEIGHT_TITLE = 0.30
    WEIGHT_SKILLS = 0.30
    WEIGHT_EXPERIENCE = 0.15
    WEIGHT_SALARY = 0.15
    WEIGHT_LOCATION = 0.10

    def calculate_confidence(
        self,
        job: dict,
        profile: dict,
        criteria: dict,
    ) -> dict:
        """
        Calculate an overall confidence score (0-100) for a job match.

        Returns a dict with overall score and individual factor breakdowns.
        """
        title_score = self._score_title(
            job.get("title", ""),
            criteria.get("target_titles", []),
            profile.get("headline", ""),
            profile.get("experience", []),
        )

        skills_score = self._score_skills(
            job.get("description", "") + " " + job.get("requirements", ""),
            profile.get("skills", []),
            profile.get("experience", []),
        )

        experience_score = self._score_experience(
            job.get("title", ""),
            job.get("description", ""),
            profile.get("experience", []),
        )

        salary_score = self._score_salary(
            job.get("salary_min"),
            job.get("salary_max"),
            criteria.get("min_salary_same_level"),
            criteria.get("min_salary_step_up"),
            self._is_step_up(job.get("title", ""), profile.get("experience", [])),
        )

        location_score = self._score_location(
            job.get("location", ""),
            job.get("remote_type", "onsite"),
            criteria.get("location", ""),
            criteria.get("remote_ok", True),
            criteria.get("hybrid_ok", True),
            criteria.get("max_office_days", 5),
        )

        overall = (
            title_score * self.WEIGHT_TITLE
            + skills_score * self.WEIGHT_SKILLS
            + experience_score * self.WEIGHT_EXPERIENCE
            + salary_score * self.WEIGHT_SALARY
            + location_score * self.WEIGHT_LOCATION
        )

        return {
            "overall": round(overall, 1),
            "title_score": round(title_score, 1),
            "skills_score": round(skills_score, 1),
            "experience_score": round(experience_score, 1),
            "salary_score": round(salary_score, 1),
            "location_score": round(location_score, 1),
        }

    def _score_title(
        self,
        job_title: str,
        target_titles: list[str],
        headline: str,
        experience: list[dict],
    ) -> float:
        """Score based on how well the job title matches target titles (0-100)."""
        if not target_titles:
            return 50.0

        job_title_lower = job_title.lower().strip()

        for target in target_titles:
            target_lower = target.lower().strip()
            if target_lower == job_title_lower:
                return 100.0
            if target_lower in job_title_lower or job_title_lower in target_lower:
                return 90.0

        for target in target_titles:
            target_lower = target.lower().strip()
            for base, synonyms in TITLE_SYNONYMS.items():
                all_related = [base] + synonyms
                target_matches = any(t in target_lower for t in all_related)
                job_matches = any(t in job_title_lower for t in all_related)
                if target_matches and job_matches:
                    return 80.0

        if self._is_step_up(job_title, experience):
            return 70.0

        if headline:
            headline_lower = headline.lower()
            headline_words = set(re.findall(r"\b\w+\b", headline_lower))
            title_words = set(re.findall(r"\b\w+\b", job_title_lower))
            common = headline_words & title_words
            filler = {"a", "an", "the", "and", "or", "in", "at", "of", "for", "to", "with"}
            meaningful_common = common - filler
            if len(meaningful_common) >= 2:
                return 60.0

        return 20.0

    def _score_skills(
        self,
        job_text: str,
        profile_skills: list[str],
        experience: list[dict],
    ) -> float:
        """Score based on skills overlap between profile and job (0-100)."""
        if not profile_skills or not job_text:
            return 50.0

        job_text_lower = job_text.lower()

        experience_skills = set()
        for exp in experience:
            desc = exp.get("description", "").lower()
            title = exp.get("title", "").lower()
            experience_skills.update(re.findall(r"\b\w+\b", desc + " " + title))

        all_skills = set()
        for skill in profile_skills:
            all_skills.add(skill.lower().strip())

        matched = 0
        for skill in all_skills:
            if skill in job_text_lower:
                matched += 1

        if not all_skills:
            return 50.0

        match_ratio = matched / len(all_skills)

        if match_ratio >= 0.8:
            return 100.0
        elif match_ratio >= 0.6:
            return 85.0
        elif match_ratio >= 0.4:
            return 70.0
        elif match_ratio >= 0.2:
            return 55.0
        elif match_ratio > 0:
            return 40.0
        return 20.0

    def _score_experience(
        self,
        job_title: str,
        job_description: str,
        experience: list[dict],
    ) -> float:
        """Score based on experience level alignment (0-100)."""
        if not experience:
            return 50.0

        job_text = (job_title + " " + job_description).lower()
        total_years = self._estimate_experience_years(experience)

        required_years = None
        year_patterns = [
            r"(\d+)\+?\s*years?\s*(?:of\s+)?experience",
            r"(\d+)\+?\s*years?\s*(?:of\s+)?relevant",
            r"minimum\s+(\d+)\s*years?",
        ]
        for pattern in year_patterns:
            match = re.search(pattern, job_text)
            if match:
                required_years = int(match.group(1))
                break

        if required_years is not None:
            if total_years >= required_years:
                excess = total_years - required_years
                if excess <= 3:
                    return 100.0
                elif excess <= 7:
                    return 85.0
                else:
                    return 70.0
            else:
                deficit = required_years - total_years
                if deficit <= 1:
                    return 75.0
                elif deficit <= 3:
                    return 50.0
                else:
                    return 25.0

        seniority_levels = {
            "entry": (0, 2),
            "junior": (0, 3),
            "associate": (1, 4),
            "mid": (3, 7),
            "senior": (5, 15),
            "staff": (8, 20),
            "lead": (5, 15),
            "principal": (10, 25),
            "director": (10, 25),
            "manager": (5, 15),
        }

        for level, (min_y, max_y) in seniority_levels.items():
            if level in job_text:
                if min_y <= total_years <= max_y:
                    return 90.0
                elif total_years < min_y:
                    return max(30.0, 90.0 - (min_y - total_years) * 15)
                else:
                    return max(50.0, 90.0 - (total_years - max_y) * 5)

        return 70.0

    def _score_salary(
        self,
        salary_min: Optional[float],
        salary_max: Optional[float],
        min_salary_same: Optional[float],
        min_salary_step_up: Optional[float],
        is_step_up: bool,
    ) -> float:
        """Score based on salary range match (0-100)."""
        if salary_min is None and salary_max is None:
            return 50.0

        min_target = min_salary_step_up if is_step_up else min_salary_same
        if min_target is None:
            return 70.0

        job_salary = salary_max if salary_max else salary_min
        if job_salary is None:
            return 50.0

        if job_salary >= min_target * 1.2:
            return 100.0
        elif job_salary >= min_target:
            return 85.0
        elif job_salary >= min_target * 0.9:
            return 65.0
        elif job_salary >= min_target * 0.8:
            return 40.0
        else:
            return 15.0

    def _score_location(
        self,
        job_location: str,
        remote_type: str,
        preferred_location: str,
        remote_ok: bool,
        hybrid_ok: bool,
        max_office_days: int,
    ) -> float:
        """Score based on location and remote type compatibility (0-100)."""
        remote_type_lower = remote_type.lower() if remote_type else "onsite"

        if remote_type_lower == "remote":
            if remote_ok:
                return 100.0
            return 60.0

        if remote_type_lower == "hybrid":
            if hybrid_ok:
                if max_office_days >= 3:
                    return 90.0
                elif max_office_days >= 2:
                    return 80.0
                else:
                    return 60.0
            return 30.0

        if not preferred_location or not job_location:
            return 50.0

        pref_lower = preferred_location.lower().strip()
        job_loc_lower = job_location.lower().strip()

        if pref_lower in job_loc_lower or job_loc_lower in pref_lower:
            return 90.0

        pref_parts = set(re.split(r"[,\s]+", pref_lower))
        job_parts = set(re.split(r"[,\s]+", job_loc_lower))
        common = pref_parts & job_parts - {"", "usa", "us", "united", "states"}

        if common:
            return 75.0

        return 30.0

    def _is_step_up(self, job_title: str, experience: list[dict]) -> bool:
        """Determine if the job represents a step-up from current level."""
        if not experience:
            return False

        current_title = ""
        if experience:
            current_title = experience[0].get("title", "").lower()

        job_title_lower = job_title.lower()
        current_level = self._extract_level(current_title)
        job_level = self._extract_level(job_title_lower)

        if current_level and job_level:
            level_order = ["intern", "junior", "associate", "mid", "", "senior", "staff", "lead", "principal", "manager", "director", "vp"]
            try:
                current_idx = level_order.index(current_level)
                job_idx = level_order.index(job_level)
                return job_idx > current_idx
            except ValueError:
                pass

        return False

    @staticmethod
    def _extract_level(title: str) -> str:
        """Extract seniority level from a job title."""
        levels = ["intern", "junior", "associate", "mid", "senior", "staff", "lead", "principal", "manager", "director", "vp"]
        title_lower = title.lower()
        for level in reversed(levels):
            if level in title_lower:
                return level
        return ""

    @staticmethod
    def _estimate_experience_years(experience: list[dict]) -> float:
        """Estimate total years of experience from experience entries."""
        total = 0.0
        for exp in experience:
            duration = exp.get("duration", "")
            years_match = re.search(r"(\d+)\s*yr", duration)
            months_match = re.search(r"(\d+)\s*mo", duration)
            if years_match:
                total += int(years_match.group(1))
            if months_match:
                total += int(months_match.group(1)) / 12.0
        if total == 0 and experience:
            total = len(experience) * 2.0
        return total

    def rank_jobs(
        self,
        jobs: list[dict],
        profile: dict,
        criteria: dict,
    ) -> list[dict]:
        """
        Score and rank a list of jobs, returning them sorted by confidence.

        Each job dict is augmented with 'confidence_score' and 'score_breakdown'.
        """
        scored_jobs = []
        excluded_companies = [c.lower() for c in criteria.get("excluded_companies", [])]
        excluded_industries = [i.lower() for i in criteria.get("excluded_industries", [])]

        for job in jobs:
            company_lower = job.get("company", "").lower()
            if any(exc in company_lower for exc in excluded_companies):
                continue

            description_lower = job.get("description", "").lower()
            if any(ind in description_lower for ind in excluded_industries):
                continue

            result = self.calculate_confidence(job, profile, criteria)

            job["confidence_score"] = result["overall"]
            job["score_breakdown"] = result
            scored_jobs.append(job)

        scored_jobs.sort(key=lambda j: j["confidence_score"], reverse=True)
        return scored_jobs
