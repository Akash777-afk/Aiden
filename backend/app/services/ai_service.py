import logging
from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.errors import ValidationFailed
from app.db.base import new_id
from app.models import AIConversation, AIMemory, AIMessage, User
from app.schemas.ai import ConversationOut, ConversationSummary, MessageOut, SendOut
from app.services.ai import safety
from app.services.ai.provider import AIContext, get_provider
from app.services.common import get_owned
from app.services.user_service import get_preferences

log = logging.getLogger("aiden.ai")
MAX_HISTORY = 20
MAX_MEMORIES = 30


def message_out(m: AIMessage) -> MessageOut:
    return MessageOut(id=m.id, role=m.role, text=m.text, actions=m.actions or [], crisis=m.crisis, created_at=m.created_at)


def conversation_out(c: AIConversation) -> ConversationOut:
    return ConversationOut(id=c.id, mode=c.mode, title=c.title, created_at=c.created_at, updated_at=c.updated_at, messages=[message_out(m) for m in c.messages])


def _context(db: Session, user: User, mode: str) -> AIContext:
    prefs = get_preferences(db, user)
    memories: list[str] = []
    if mode == "personal" and prefs["ai"].get("personalMemory"):
        memories = [m.label for m in db.scalars(select(AIMemory).where(AIMemory.user_id == user.id, AIMemory.enabled.is_(True)))]
    return AIContext(mode=mode, user_name=user.profile.name, memories=memories, tone=prefs["ai"].get("tone", "warm"), length=prefs["ai"].get("length", "balanced"))


def respond(db: Session, user: User, history: list[dict], mode: str) -> tuple[str, list[dict], bool, str]:
    """Safety pre-check → provider → safety post-check. Returns (text, actions, crisis, provider_name)."""
    s = safety.check_input(history[-1]["text"])
    if s.crisis:
        log.warning("crisis_flag user=%s", user.id)  # no message content in logs
        return safety.CRISIS_REPLY, [{"label": "Find a professional", "to": "/connect"}, {"label": "Breathe with me", "to": "/pause/breathe"}], True, "safety"
    if s.harm_to_others:
        return safety.HARM_OTHERS_REPLY, [{"label": "Find a professional", "to": "/connect"}], True, "safety"
    if s.medical:
        return safety.MEDICAL_REPLY, [{"label": "Talk to a professional", "to": "/connect"}], False, "safety"
    provider = get_provider()
    try:
        reply = provider.generate(history[-MAX_HISTORY:], _context(db, user, mode))
    except Exception:  # provider outage must never surface a stack trace to a distressed user
        log.exception("ai_provider_error provider=%s", provider.name)
        return "I’m having trouble responding right now. Please try again in a moment — and if you need support urgently, call Tele-MANAS on 14416.", [], False, "error"
    text, flags = safety.check_output(reply.text)
    if flags:
        log.warning("ai_output_blocked flags=%s provider=%s", flags, provider.name)
    return text, reply.actions, False, provider.name


# ---------- Conversations (Personal / Guided — persisted, encrypted)


def list_conversations(db: Session, user: User) -> list[ConversationSummary]:
    counts = dict(db.execute(select(AIMessage.conversation_id, func.count()).join(AIConversation).where(AIConversation.user_id == user.id).group_by(AIMessage.conversation_id)).all())
    rows = db.scalars(select(AIConversation).where(AIConversation.user_id == user.id).order_by(AIConversation.updated_at.desc())).all()
    return [ConversationSummary(id=c.id, mode=c.mode, title=c.title, updated_at=c.updated_at, message_count=counts.get(c.id, 0)) for c in rows]


def create_conversation(db: Session, user: User, mode: str) -> ConversationOut:
    c = AIConversation(user_id=user.id, mode=mode, title="New conversation")
    db.add(c)
    db.commit()
    return conversation_out(c)


def get_conversation(db: Session, user: User, cid: str) -> ConversationOut:
    return conversation_out(get_owned(db, AIConversation, cid, user.id, "Conversation"))


def delete_conversation(db: Session, user: User, cid: str) -> None:
    db.delete(get_owned(db, AIConversation, cid, user.id, "Conversation"))
    db.commit()


def clear_conversation(db: Session, user: User, cid: str) -> None:
    c = get_owned(db, AIConversation, cid, user.id, "Conversation")
    db.execute(delete(AIMessage).where(AIMessage.conversation_id == c.id))
    c.title = "New conversation"
    db.commit()


def send(db: Session, user: User, cid: str, text: str) -> SendOut:
    c = get_owned(db, AIConversation, cid, user.id, "Conversation")
    now = datetime.now(timezone.utc)
    um = AIMessage(id=new_id(), conversation_id=c.id, role="user", text=text, created_at=now)
    if not c.messages:
        c.title = text[:42] + ("…" if len(text) > 42 else "")
    history = [{"role": m.role, "text": m.text} for m in c.messages] + [{"role": "user", "text": text}]
    reply, actions, crisis, provider = respond(db, user, history, c.mode)
    am = AIMessage(id=new_id(), conversation_id=c.id, role="ai", text=reply, actions=actions, crisis=crisis, provider=provider, created_at=datetime.now(timezone.utc))
    db.add_all([um, am])
    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    return SendOut(user_message=message_out(um), assistant_message=message_out(am))


def ephemeral(db: Session, user: User, text: str, history: list[dict]) -> MessageOut:
    """General mode: nothing is written to the database."""
    reply, actions, crisis, _ = respond(db, user, history + [{"role": "user", "text": text}], "general")
    return MessageOut(id=new_id(), role="ai", text=reply, actions=actions, crisis=crisis, created_at=datetime.now(timezone.utc))


# ---------- Memories (user-approved context)


def list_memories(db: Session, user: User) -> list[AIMemory]:
    return list(db.scalars(select(AIMemory).where(AIMemory.user_id == user.id).order_by(AIMemory.created_at)))


def add_memory(db: Session, user: User, label: str) -> AIMemory:
    if db.scalar(select(func.count()).select_from(AIMemory).where(AIMemory.user_id == user.id)) >= MAX_MEMORIES:
        raise ValidationFailed(f"You can keep up to {MAX_MEMORIES} memories")
    m = AIMemory(user_id=user.id, label=label, source="user")
    db.add(m)
    db.commit()
    return m


def set_memory(db: Session, user: User, mid: str, enabled: bool) -> AIMemory:
    m = get_owned(db, AIMemory, mid, user.id, "Memory")
    m.enabled = enabled
    db.commit()
    return m


def delete_memory(db: Session, user: User, mid: str) -> None:
    db.delete(get_owned(db, AIMemory, mid, user.id, "Memory"))
    db.commit()


def clear_memories(db: Session, user: User) -> None:
    db.execute(delete(AIMemory).where(AIMemory.user_id == user.id))
    db.commit()
