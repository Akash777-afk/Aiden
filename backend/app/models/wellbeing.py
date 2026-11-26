"""Check-ins, journal, habits, routine and sleep — the user's personal wellbeing records."""

from datetime import date, datetime

from sqlalchemy import JSON, Boolean, CheckConstraint, Date, Float, ForeignKey, Index, Integer, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, EncryptedText, IdMixin, TimestampMixin, UTCDateTime, utcnow

EMOTIONS = ("calm", "happy", "okay", "stressed", "anxious", "sad", "frustrated")
HABIT_CATEGORIES = ("wake", "hydration", "activity", "sleep", "mindfulness", "journaling", "reading", "growth")


class MoodCheckin(IdMixin, Base):
    __tablename__ = "mood_checkins"
    __table_args__ = (
        Index("ix_mood_checkins_user_created", "user_id", "created_at"),
        CheckConstraint("intensity BETWEEN 1 AND 5", name="intensity_range"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    emotion: Mapped[str] = mapped_column(String(20))
    intensity: Mapped[int] = mapped_column(SmallInteger, default=3)
    note: Mapped[str | None] = mapped_column(EncryptedText)
    triggers: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class JournalEntry(IdMixin, TimestampMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (Index("ix_journal_entries_user_created", "user_id", "created_at"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(EncryptedText)
    body: Mapped[str] = mapped_column(EncryptedText)
    mood: Mapped[str | None] = mapped_column(String(20))
    tags: Mapped[list] = mapped_column(JSON, default=list)


class Habit(IdMixin, TimestampMixin, Base):
    __tablename__ = "habits"
    __table_args__ = (Index("ix_habits_user_archived", "user_id", "archived"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(60))
    category: Mapped[str] = mapped_column(String(20))
    time: Mapped[str] = mapped_column(String(5))  # HH:MM local
    frequency: Mapped[list] = mapped_column(JSON)  # weekday ints, 0 = Sunday (JS convention)
    reminder: Mapped[bool] = mapped_column(Boolean, default=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    logs: Mapped[list["HabitCompletion"]] = relationship(back_populates="habit", cascade="all, delete-orphan", passive_deletes=True)


class HabitCompletion(IdMixin, Base):
    __tablename__ = "habit_completions"
    __table_args__ = (
        UniqueConstraint("habit_id", "date"),
        CheckConstraint("status IN ('done','skipped')", name="status_valid"),
    )

    habit_id: Mapped[str] = mapped_column(ForeignKey("habits.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    habit: Mapped[Habit] = relationship(back_populates="logs")


class RoutineStep(IdMixin, Base):
    __tablename__ = "routine_steps"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    time: Mapped[str] = mapped_column(String(5))
    label: Mapped[str] = mapped_column(String(40))
    icon: Mapped[str] = mapped_column(String(30), default="Sparkles")
    position: Mapped[int] = mapped_column(Integer, default=0)


class SleepReflection(IdMixin, TimestampMixin, Base):
    __tablename__ = "sleep_reflections"
    __table_args__ = (
        UniqueConstraint("user_id", "date"),
        CheckConstraint("quality BETWEEN 1 AND 5", name="quality_range"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)  # the night's date (evening it started)
    bedtime: Mapped[str] = mapped_column(String(5))
    wake: Mapped[str] = mapped_column(String(5))
    hours: Mapped[float] = mapped_column(Float)
    quality: Mapped[int] = mapped_column(SmallInteger)
    note: Mapped[str | None] = mapped_column(EncryptedText)


class SleepFavorite(Base):
    __tablename__ = "sleep_favorites"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    content_id: Mapped[str] = mapped_column(String(40), primary_key=True)
