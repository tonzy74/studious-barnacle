from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class SearchCriteria(Base):
    __tablename__ = "search_criteria"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    target_titles = Column(JSON, default=list, nullable=False)
    min_salary_same_level = Column(Float, nullable=True)
    min_salary_step_up = Column(Float, nullable=True)
    location = Column(String(255), nullable=True)
    max_office_days = Column(Integer, default=5, nullable=False)
    remote_ok = Column(Boolean, default=True, nullable=False)
    hybrid_ok = Column(Boolean, default=True, nullable=False)
    excluded_industries = Column(JSON, default=list, nullable=False)
    excluded_companies = Column(JSON, default=list, nullable=False)
    daily_batch_size = Column(Integer, default=10, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="criteria")

    def __repr__(self):
        return f"<SearchCriteria(id={self.id}, user_id={self.user_id}, titles={self.target_titles})>"
