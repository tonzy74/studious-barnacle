from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLYING = "applying"
    APPLIED = "applied"
    VIEWED = "viewed"
    RESPONSE = "response"
    ERROR = "error"


class RemoteType(str, enum.Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_job_id = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    remote_type = Column(
        Enum(RemoteType), default=RemoteType.ONSITE, nullable=False
    )
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0, nullable=False)
    status = Column(
        Enum(JobStatus), default=JobStatus.PENDING, nullable=False, index=True
    )
    score_breakdown = Column(Text, nullable=True)
    job_url = Column(String(1000), nullable=True)
    applied_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="jobs")

    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title}, company={self.company}, status={self.status})>"
