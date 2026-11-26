"""TAC (Thoughts → Actions → Consequences) decision sessions, normalised."""

from sqlalchemy import JSON, ForeignKey, Integer, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, EncryptedText, IdMixin, TimestampMixin

THOUGHT_KEYS = ("happening", "thinking", "feeling", "assumptions", "worry")
CONSEQUENCE_KINDS = ("benefits", "risks", "short", "long", "uncertainties")


class TacSession(IdMixin, TimestampMixin, Base):
    __tablename__ = "tac_sessions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(EncryptedText)
    chosen_action_id: Mapped[str | None] = mapped_column(String(36))
    reflection: Mapped[str | None] = mapped_column(EncryptedText)
    map_layout: Mapped[dict] = mapped_column(JSON, default=dict)  # node positions, free notes, extra edges

    thoughts: Mapped[list["TacThought"]] = relationship(cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")
    actions: Mapped[list["TacAction"]] = relationship(cascade="all, delete-orphan", passive_deletes=True, lazy="selectin", order_by="TacAction.position")


class TacThought(IdMixin, Base):
    __tablename__ = "tac_thoughts"
    __table_args__ = (UniqueConstraint("session_id", "key"),)

    session_id: Mapped[str] = mapped_column(ForeignKey("tac_sessions.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(EncryptedText)


class TacAction(Base):
    __tablename__ = "tac_actions"

    # Client-generated ids are kept (the decision map references them); unique per session.
    pk: Mapped[str] = mapped_column(String(36), primary_key=True)
    id: Mapped[str] = mapped_column(String(64))
    session_id: Mapped[str] = mapped_column(ForeignKey("tac_sessions.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(EncryptedText)
    rating: Mapped[int] = mapped_column(SmallInteger, default=3)
    position: Mapped[int] = mapped_column(Integer, default=0)

    consequences: Mapped[list["TacConsequence"]] = relationship(cascade="all, delete-orphan", passive_deletes=True, lazy="selectin")

    __table_args__ = (UniqueConstraint("session_id", "id"),)


class TacConsequence(IdMixin, Base):
    __tablename__ = "tac_consequences"
    __table_args__ = (UniqueConstraint("action_pk", "kind"),)

    action_pk: Mapped[str] = mapped_column(ForeignKey("tac_actions.pk", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(EncryptedText)
