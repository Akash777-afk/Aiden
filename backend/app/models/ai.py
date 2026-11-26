from datetime import datetime

from sqlalchemy import JSON, Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, EncryptedText, IdMixin, TimestampMixin, UTCDateTime, utcnow


class AIConversation(IdMixin, TimestampMixin, Base):
    __tablename__ = "ai_conversations"
    __table_args__ = (Index("ix_ai_conversations_user_updated", "user_id", "updated_at"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    mode: Mapped[str] = mapped_column(String(10))  # personal | guided  (general is never stored)
    title: Mapped[str] = mapped_column(EncryptedText)

    messages: Mapped[list["AIMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True, order_by="AIMessage.created_at"
    )


class AIMessage(IdMixin, Base):
    __tablename__ = "ai_messages"
    __table_args__ = (Index("ix_ai_messages_conv_created", "conversation_id", "created_at"),)

    conversation_id: Mapped[str] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(10))  # user | ai
    text: Mapped[str] = mapped_column(EncryptedText)
    actions: Mapped[list] = mapped_column(JSON, default=list)
    crisis: Mapped[bool] = mapped_column(Boolean, default=False)
    provider: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    conversation: Mapped[AIConversation] = relationship(back_populates="messages")


class AIMemory(IdMixin, Base):
    """Context the user has explicitly approved for Personal mode."""

    __tablename__ = "ai_memories"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(EncryptedText)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str] = mapped_column(String(20), default="user")  # user | suggested
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
