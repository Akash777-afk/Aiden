from datetime import datetime

from sqlalchemy import JSON, Boolean, ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IdMixin, UTCDateTime, utcnow


class Notification(IdMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_created", "user_id", "created_at"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))  # reminder | insight | content | session | system
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(String(300))
    link: Mapped[str | None] = mapped_column(String(200))
    read_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)


class LearnCategory(Base):
    __tablename__ = "learn_categories"

    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    label: Mapped[str] = mapped_column(String(60))
    icon: Mapped[str] = mapped_column(String(30))
    color: Mapped[str] = mapped_column(String(9))
    tint: Mapped[str] = mapped_column(String(20))
    position: Mapped[int] = mapped_column(SmallInteger, default=0)


class LearnArticle(Base):
    __tablename__ = "learn_articles"

    slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("learn_categories.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    summary: Mapped[str] = mapped_column(String(240))
    minutes: Mapped[int] = mapped_column(SmallInteger)
    sections: Mapped[list] = mapped_column(JSON)
    takeaway: Mapped[str] = mapped_column(Text)
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    position: Mapped[int] = mapped_column(SmallInteger, default=0)


class LearnProgress(Base):
    __tablename__ = "learn_progress"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    article_slug: Mapped[str] = mapped_column(ForeignKey("learn_articles.slug", ondelete="CASCADE"), primary_key=True)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime())
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)
