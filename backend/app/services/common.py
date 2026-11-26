from datetime import date, datetime, timedelta
from typing import TypeVar
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NotFound
from app.models import Preferences, User

M = TypeVar("M")


def get_owned(db: Session, model: type[M], obj_id: str, user_id: str, what: str | None = None) -> M:
    """Fetch a row that belongs to the user. Foreign rows look exactly like missing ones (404)."""
    obj = db.scalar(select(model).where(model.id == obj_id, model.user_id == user_id))
    if obj is None:
        raise NotFound(what or model.__name__)
    return obj


def user_tz(db: Session, user: User) -> ZoneInfo:
    tz = db.scalar(select(Preferences.timezone).where(Preferences.user_id == user.id)) or settings.DEFAULT_TIMEZONE
    try:
        return ZoneInfo(tz)
    except ZoneInfoNotFoundError:
        return ZoneInfo(settings.DEFAULT_TIMEZONE)


def local_today(db: Session, user: User) -> date:
    return datetime.now(user_tz(db, user)).date()


def local_date(dt: datetime, tz: ZoneInfo) -> date:
    return dt.astimezone(tz).date()


def day_range(end: date, days: int) -> list[date]:
    return [end - timedelta(days=days - 1 - i) for i in range(days)]


def js_weekday(d: date) -> int:
    """0 = Sunday … 6 = Saturday (frontend/JS convention)."""
    return (d.weekday() + 1) % 7


def local_day_bounds_utc(d: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    start = datetime(d.year, d.month, d.day, tzinfo=tz)
    return start, start + timedelta(days=1)
