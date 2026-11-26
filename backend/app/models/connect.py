"""Professionals, credentials, availability, appointments and reviews."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, CheckConstraint, Float, ForeignKey, Index, Integer, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, EncryptedText, IdMixin, TimestampMixin, UTCDateTime, utcnow

CONSULT_TYPES = {"text": 0.6, "voice": 0.9, "video": 1.0, "scheduled": 3.6}
CONSULT_DURATION_MIN = {"text": 0, "voice": 45, "video": 50, "scheduled": 50}


class Professional(IdMixin, TimestampMixin, Base):
    __tablename__ = "professionals"

    slug: Mapped[str] = mapped_column(String(60), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    designation: Mapped[str] = mapped_column(String(80))
    bio: Mapped[str] = mapped_column(Text)
    specializations: Mapped[list] = mapped_column(JSON)
    approach: Mapped[list] = mapped_column(JSON, default=list)
    languages: Mapped[list] = mapped_column(JSON)
    experience_years: Mapped[int] = mapped_column(SmallInteger)
    base_fee: Mapped[int] = mapped_column(Integer)  # INR per session
    modes: Mapped[list] = mapped_column(JSON)
    avatar: Mapped[dict | None] = mapped_column(JSON)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    rating_avg: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=True)  # fictional demo profile
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    credentials: Mapped[list["Credential"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    availability: Mapped[list["AvailabilityRule"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class Credential(IdMixin, Base):
    __tablename__ = "credentials"

    professional_id: Mapped[str] = mapped_column(ForeignKey("professionals.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))  # qualification | registration
    title: Mapped[str] = mapped_column(String(120))
    number: Mapped[str | None] = mapped_column(String(60))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class AvailabilityRule(IdMixin, Base):
    """Weekly recurring window, e.g. Mon 09:00–13:30 with 90-minute slots (professional's local time)."""

    __tablename__ = "availability"

    professional_id: Mapped[str] = mapped_column(ForeignKey("professionals.id", ondelete="CASCADE"), index=True)
    weekday: Mapped[int] = mapped_column(SmallInteger)  # 0 = Sunday
    start_time: Mapped[str] = mapped_column(String(5))
    end_time: Mapped[str] = mapped_column(String(5))
    slot_minutes: Mapped[int] = mapped_column(SmallInteger, default=90)


class Appointment(IdMixin, TimestampMixin, Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # `active_slot` is set while the booking is live and NULL once cancelled, so a
        # unique index prevents double-booking at the database level (NULLs don't collide).
        UniqueConstraint("professional_id", "active_slot"),
        Index("ix_appointments_user_starts", "user_id", "starts_at"),
        CheckConstraint("status IN ('confirmed','cancelled','completed')", name="status_valid"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    professional_id: Mapped[str] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"))
    type: Mapped[str] = mapped_column(String(10))
    starts_at: Mapped[datetime] = mapped_column(UTCDateTime())
    duration_min: Mapped[int] = mapped_column(SmallInteger)
    price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="confirmed")
    active_slot: Mapped[str | None] = mapped_column(String(25))
    note: Mapped[str | None] = mapped_column(EncryptedText)
    ref: Mapped[str] = mapped_column(String(16), unique=True)

    professional: Mapped[Professional] = relationship(lazy="joined")


class Review(IdMixin, Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),)

    professional_id: Mapped[str] = mapped_column(ForeignKey("professionals.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    appointment_id: Mapped[str | None] = mapped_column(ForeignKey("appointments.id", ondelete="SET NULL"), unique=True)
    display_name: Mapped[str] = mapped_column(String(40))
    rating: Mapped[int] = mapped_column(SmallInteger)
    text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
