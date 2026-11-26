from collections import Counter
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import MoodCheckin, User
from app.schemas.base import Page
from app.schemas.wellbeing import CheckinIn, CheckinOut, CheckinSummary, EmotionCount
from app.services.common import get_owned, local_date, local_day_bounds_utc, local_today, user_tz


def create(db: Session, user: User, data: CheckinIn) -> MoodCheckin:
    c = MoodCheckin(user_id=user.id, **data.model_dump())
    db.add(c)
    db.commit()
    return c


def list_(db: Session, user: User, start: date | None, end: date | None, limit: int, offset: int) -> Page[CheckinOut]:
    tz = user_tz(db, user)
    q = select(MoodCheckin).where(MoodCheckin.user_id == user.id)
    if start:
        q = q.where(MoodCheckin.created_at >= local_day_bounds_utc(start, tz)[0])
    if end:
        q = q.where(MoodCheckin.created_at < local_day_bounds_utc(end, tz)[1])
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    rows = db.scalars(q.order_by(MoodCheckin.created_at.desc()).limit(limit).offset(offset)).all()
    return Page[CheckinOut](items=[CheckinOut.model_validate(r) for r in rows], total=total, limit=limit, offset=offset)


def delete(db: Session, user: User, cid: str) -> None:
    db.delete(get_owned(db, MoodCheckin, cid, user.id, "Check-in"))
    db.commit()


def streak(days_with_checkins: set[date], today: date) -> int:
    """Consecutive days ending today (or yesterday, if today has no check-in yet)."""
    n = 0
    d = today if today in days_with_checkins else today - timedelta(days=1)
    while d in days_with_checkins:
        n += 1
        d -= timedelta(days=1)
    return n


def summary(db: Session, user: User, days: int) -> CheckinSummary:
    tz = user_tz(db, user)
    today = local_today(db, user)
    since = local_day_bounds_utc(today - timedelta(days=days - 1), tz)[0]
    rows = db.scalars(select(MoodCheckin).where(MoodCheckin.user_id == user.id, MoodCheckin.created_at >= since)).all()
    counts = Counter(r.emotion for r in rows)
    lookback = local_day_bounds_utc(today - timedelta(days=366), tz)[0]
    all_days = {local_date(dt, tz) for dt in db.scalars(select(MoodCheckin.created_at).where(MoodCheckin.user_id == user.id, MoodCheckin.created_at >= lookback))}
    dist = [EmotionCount(emotion=e, count=c) for e, c in counts.most_common()]
    return CheckinSummary(days=days, count=len(rows), streak=streak(all_days, today), distribution=dist, top_emotion=dist[0].emotion if dist else None)
