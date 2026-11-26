from datetime import date, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.errors import NotFound, ValidationFailed
from app.models import SleepFavorite, SleepReflection, User
from app.schemas.wellbeing import SleepIn, SleepOut
from app.services.common import local_today

KNOWN_CONTENT = {f"t{i}" for i in range(1, 10)}  # mirrors frontend SLEEP_TRACKS ids (catalog moves server-side in Phase 4)


def hours_between(bed: str, wake: str) -> float:
    bh, bm = map(int, bed.split(":"))
    wh, wm = map(int, wake.split(":"))
    mins = (wh * 60 + wm) - (bh * 60 + bm)
    if mins <= 0:
        mins += 24 * 60  # crossed midnight
    return round(mins / 60, 1)


def upsert(db: Session, user: User, night: date, data: SleepIn) -> SleepOut:
    today = local_today(db, user)
    if night > today:
        raise ValidationFailed("You can’t log sleep for a future night")
    hours = hours_between(data.bedtime, data.wake)
    if hours > 16:
        raise ValidationFailed("That’s over 16 hours — please check the times", details=[{"field": "wake", "message": "Check times"}])
    row = db.scalar(select(SleepReflection).where(SleepReflection.user_id == user.id, SleepReflection.date == night))
    if row is None:
        row = SleepReflection(user_id=user.id, date=night)
        db.add(row)
    row.bedtime, row.wake, row.hours, row.quality, row.note = data.bedtime, data.wake, hours, data.quality, data.note
    db.commit()
    return SleepOut.model_validate(row)


def list_(db: Session, user: User, days: int) -> list[SleepOut]:
    since = local_today(db, user) - timedelta(days=days)
    rows = db.scalars(select(SleepReflection).where(SleepReflection.user_id == user.id, SleepReflection.date >= since).order_by(SleepReflection.date.desc())).all()
    return [SleepOut.model_validate(r) for r in rows]


def delete_(db: Session, user: User, night: date) -> None:
    res = db.execute(delete(SleepReflection).where(SleepReflection.user_id == user.id, SleepReflection.date == night))
    if res.rowcount == 0:
        raise NotFound("Sleep log")
    db.commit()


def get_favorites(db: Session, user: User) -> list[str]:
    return list(db.scalars(select(SleepFavorite.content_id).where(SleepFavorite.user_id == user.id)))


def put_favorites(db: Session, user: User, ids: list[str]) -> list[str]:
    ids = list(dict.fromkeys(ids))
    unknown = [i for i in ids if i not in KNOWN_CONTENT]
    if unknown:
        raise ValidationFailed(f"Unknown content ids: {', '.join(unknown)}")
    db.execute(delete(SleepFavorite).where(SleepFavorite.user_id == user.id))
    for i in ids:
        db.add(SleepFavorite(user_id=user.id, content_id=i))
    db.commit()
    return ids
