from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin, UTCDateTime, utcnow


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(20), default="user")  # user | admin
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime())

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="joined")
    preferences: Mapped["Preferences"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(40))  # preferred name used in greetings
    phone: Mapped[str | None] = mapped_column(String(20))
    city: Mapped[str | None] = mapped_column(String(60))
    dob: Mapped[date | None] = mapped_column(Date)
    pronouns: Mapped[str | None] = mapped_column(String(20))
    avatar: Mapped[dict | None] = mapped_column(JSON)  # illustrated avatar look
    photo_url: Mapped[str | None] = mapped_column(String(500))

    user: Mapped[User] = relationship(back_populates="profile")


class Preferences(TimestampMixin, Base):
    __tablename__ = "preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    data: Mapped[dict] = mapped_column(JSON, default=dict)  # theme, notifications, privacy, ai …

    user: Mapped[User] = relationship(back_populates="preferences")


class Consent(IdMixin, Base):
    __tablename__ = "consents"
    __table_args__ = (UniqueConstraint("user_id", "type"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(30))  # terms | privacy | ai_memory | analytics
    granted: Mapped[bool] = mapped_column(Boolean)
    version: Mapped[str] = mapped_column(String(20), default="2026-11")
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, onupdate=utcnow)


class RefreshToken(IdMixin, Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (Index("ix_refresh_tokens_user_active", "user_id", "revoked_at"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime())
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
