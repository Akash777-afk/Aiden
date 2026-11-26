from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JournalEntry, User
from app.schemas.base import Page
from app.schemas.wellbeing import JournalIn, JournalOut, JournalPatch
from app.services.common import get_owned, local_day_bounds_utc, user_tz


def _out(e: JournalEntry) -> JournalOut:
    edited = e.updated_at if (e.updated_at - e.created_at).total_seconds() > 2 else None
    return JournalOut(id=e.id, title=e.title, body=e.body, mood=e.mood, tags=e.tags or [], created_at=e.created_at, edited_at=edited)


def _default_title(db: Session, user: User) -> str:
    return datetime.now(user_tz(db, user)).strftime("%A, %d %b")


def create(db: Session, user: User, data: JournalIn) -> JournalOut:
    e = JournalEntry(user_id=user.id, title=(data.title or "").strip() or _default_title(db, user), body=data.body, mood=data.mood, tags=data.tags)
    db.add(e)
    db.commit()
    return _out(e)


def get(db: Session, user: User, eid: str) -> JournalOut:
    return _out(get_owned(db, JournalEntry, eid, user.id, "Journal entry"))


def update(db: Session, user: User, eid: str, patch: JournalPatch) -> JournalOut:
    e = get_owned(db, JournalEntry, eid, user.id, "Journal entry")
    data = patch.model_dump(exclude_unset=True)
    if "title" in data:
        data["title"] = (data["title"] or "").strip() or e.title
    for k, v in data.items():
        if v is not None or k == "mood":
            setattr(e, k, v)
    db.commit()
    return _out(e)


def delete(db: Session, user: User, eid: str) -> None:
    db.delete(get_owned(db, JournalEntry, eid, user.id, "Journal entry"))
    db.commit()


def list_(db: Session, user: User, q: str | None, tag: str | None, start: date | None, end: date | None, limit: int, offset: int) -> Page[JournalOut]:
    tz = user_tz(db, user)
    stmt = select(JournalEntry).where(JournalEntry.user_id == user.id)
    if start:
        stmt = stmt.where(JournalEntry.created_at >= local_day_bounds_utc(start, tz)[0])
    if end:
        stmt = stmt.where(JournalEntry.created_at < local_day_bounds_utc(end, tz)[1])
    rows = db.scalars(stmt.order_by(JournalEntry.created_at.desc())).all()
    # Title/body are encrypted at rest, so text search and tag filtering run on decrypted values
    # (bounded per user). A blind-index / search service can replace this at scale.
    if q:
        needle = q.lower().strip()
        rows = [r for r in rows if needle in r.title.lower() or needle in r.body.lower()]
    if tag:
        rows = [r for r in rows if tag.lower() in (r.tags or [])]
    total = len(rows)
    return Page[JournalOut](items=[_out(r) for r in rows[offset : offset + limit]], total=total, limit=limit, offset=offset)


def tags(db: Session, user: User) -> list[str]:
    seen: list[str] = []
    for t in db.scalars(select(JournalEntry.tags).where(JournalEntry.user_id == user.id).order_by(JournalEntry.created_at.desc())):
        for x in t or []:
            if x not in seen:
                seen.append(x)
    return seen
