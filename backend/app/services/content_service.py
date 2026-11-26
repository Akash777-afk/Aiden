from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.core.errors import NotFound
from app.models import LearnArticle, LearnCategory, LearnProgress, Notification, User
from app.schemas.misc import ArticleDetail, ArticleOut, CategoryOut, NotificationList, NotificationOut
from app.services.common import get_owned

# ---------- Learn


def categories(db: Session) -> list[CategoryOut]:
    return [CategoryOut.model_validate(c) for c in db.scalars(select(LearnCategory).order_by(LearnCategory.position))]


def _progress(db: Session, user: User) -> dict[str, LearnProgress]:
    return {p.article_slug: p for p in db.scalars(select(LearnProgress).where(LearnProgress.user_id == user.id))}


def _article(a: LearnArticle, p: LearnProgress | None, detail: bool = False):
    base = dict(id=a.slug, category=a.category_id, title=a.title, summary=a.summary, minutes=a.minutes, completed=bool(p and p.completed_at), bookmarked=bool(p and p.bookmarked))
    return ArticleDetail(**base, sections=a.sections, takeaway=a.takeaway) if detail else ArticleOut(**base)


def articles(db: Session, user: User, category: str | None, q: str | None) -> list[ArticleOut]:
    stmt = select(LearnArticle).where(LearnArticle.published.is_(True))
    if category:
        stmt = stmt.where(LearnArticle.category_id == category)
    rows = db.scalars(stmt.order_by(LearnArticle.position)).all()
    if q:
        rows = [a for a in rows if q.lower() in (a.title + " " + a.summary).lower()]
    prog = _progress(db, user)
    return [_article(a, prog.get(a.slug)) for a in rows]


def article(db: Session, user: User, slug: str) -> ArticleDetail:
    a = db.get(LearnArticle, slug)
    if a is None or not a.published:
        raise NotFound("Article")
    return _article(a, _progress(db, user).get(slug), detail=True)


def _upsert_progress(db: Session, user: User, slug: str) -> LearnProgress:
    if db.get(LearnArticle, slug) is None:
        raise NotFound("Article")
    p = db.get(LearnProgress, (user.id, slug))
    if p is None:
        p = LearnProgress(user_id=user.id, article_slug=slug)
        db.add(p)
    return p


def set_complete(db: Session, user: User, slug: str, done: bool) -> ArticleDetail:
    p = _upsert_progress(db, user, slug)
    p.completed_at = datetime.now(timezone.utc) if done else None
    db.commit()
    return article(db, user, slug)


def set_bookmark(db: Session, user: User, slug: str, on: bool) -> ArticleDetail:
    p = _upsert_progress(db, user, slug)
    p.bookmarked = on
    db.commit()
    return article(db, user, slug)


# ---------- Notifications


def _n_out(n: Notification) -> NotificationOut:
    return NotificationOut(id=n.id, kind=n.kind, title=n.title, body=n.body, to=n.link, read=n.read_at is not None, at=n.created_at)


def notifications(db: Session, user: User) -> NotificationList:
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100)).all()
    unread = db.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == user.id, Notification.read_at.is_(None)))
    return NotificationList(items=[_n_out(n) for n in rows], unread=unread)


def mark_read(db: Session, user: User, nid: str) -> NotificationOut:
    n = get_owned(db, Notification, nid, user.id, "Notification")
    n.read_at = n.read_at or datetime.now(timezone.utc)
    db.commit()
    return _n_out(n)


def mark_all_read(db: Session, user: User) -> None:
    db.execute(update(Notification).where(Notification.user_id == user.id, Notification.read_at.is_(None)).values(read_at=datetime.now(timezone.utc).replace(tzinfo=None)))
    db.commit()


def clear_notifications(db: Session, user: User) -> None:
    db.execute(delete(Notification).where(Notification.user_id == user.id))
    db.commit()


def push(db: Session, user_id: str, kind: str, title: str, body: str, link: str | None = None) -> Notification:
    """Internal hook used by reminders/insights jobs (delivery channels arrive in Phase 5)."""
    n = Notification(user_id=user_id, kind=kind, title=title[:120], body=body[:300], link=link)
    db.add(n)
    db.commit()
    return n
