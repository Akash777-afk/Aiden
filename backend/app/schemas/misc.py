from datetime import date, datetime

from app.schemas.base import CamelModel

# ---------- Insights


class InsightStats(CamelModel):
    avg_mood: float | None
    mood_delta_pct: int | None
    habit_pct: int | None
    habit_delta_pct: int | None
    avg_sleep: float | None
    journal_entries: int
    checkin_streak: int


class MoodPoint(CamelModel):
    date: date
    score: float | None
    count: int


class HabitPoint(CamelModel):
    date: date
    pct: int


class SleepPoint(CamelModel):
    date: date
    hours: float | None
    quality: int | None


class JournalPoint(CamelModel):
    label: str
    entries: int


class Growth(CamelModel):
    chat: bool
    habit: bool
    sleep: bool
    reflect: bool
    grow: bool


class InsightsOut(CamelModel):
    days: int
    stats: InsightStats
    mood: list[MoodPoint]
    habits: list[HabitPoint]
    sleep: list[SleepPoint]
    journal: list[JournalPoint]
    growth: Growth
    patterns: list[str]


# ---------- Learn


class CategoryOut(CamelModel):
    id: str
    label: str
    icon: str
    color: str
    tint: str


class ArticleOut(CamelModel):
    id: str  # slug (the frontend routes by it)
    category: str
    title: str
    summary: str
    minutes: int
    completed: bool = False
    bookmarked: bool = False


class ArticleDetail(ArticleOut):
    sections: list[dict]
    takeaway: str


# ---------- Notifications


class NotificationOut(CamelModel):
    id: str
    kind: str
    title: str
    body: str
    to: str | None
    read: bool
    at: datetime


class NotificationList(CamelModel):
    items: list[NotificationOut]
    unread: int
