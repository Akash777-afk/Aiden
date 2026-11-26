from datetime import date, datetime

from pydantic import Field, field_validator

from app.schemas.base import HHMM, CamelModel, Emotion


def clean_tags(v: list[str]) -> list[str]:
    out: list[str] = []
    for t in v:
        t = t.strip().lower().lstrip("#").replace(" ", "-")[:20]
        if t and t not in out:
            out.append(t)
    return out


def clean_freq(v: list[int]) -> list[int]:
    if any(d < 0 or d > 6 for d in v):
        raise ValueError("Weekdays must be between 0 (Sun) and 6 (Sat)")
    return sorted(set(v))


# ---------- Check-ins


class CheckinIn(CamelModel):
    emotion: Emotion
    intensity: int = Field(3, ge=1, le=5)
    note: str | None = Field(None, max_length=500)
    triggers: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("triggers")
    @classmethod
    def _triggers(cls, v: list[str]) -> list[str]:
        out = []
        for t in v:
            t = t.strip()[:30]
            if t and t not in out:
                out.append(t)
        return out


class CheckinOut(CamelModel):
    id: str
    emotion: str
    intensity: int
    note: str | None
    triggers: list[str]
    at: datetime = Field(validation_alias="created_at")


class EmotionCount(CamelModel):
    emotion: str
    count: int


class CheckinSummary(CamelModel):
    days: int
    count: int
    streak: int
    distribution: list[EmotionCount]
    top_emotion: str | None


# ---------- Journal


class JournalIn(CamelModel):
    title: str | None = Field(None, max_length=80)
    body: str = Field(min_length=10, max_length=5000)
    mood: Emotion | None = None
    tags: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("tags")
    @classmethod
    def _tags(cls, v: list[str]) -> list[str]:
        return clean_tags(v)


class JournalPatch(CamelModel):
    title: str | None = Field(None, max_length=80)
    body: str | None = Field(None, min_length=10, max_length=5000)
    mood: Emotion | None = None
    tags: list[str] | None = Field(None, max_length=6)

    @field_validator("tags")
    @classmethod
    def _tags(cls, v: list[str] | None) -> list[str] | None:
        return clean_tags(v) if v is not None else v


class JournalOut(CamelModel):
    id: str
    title: str
    body: str
    mood: str | None
    tags: list[str]
    at: datetime = Field(validation_alias="created_at")
    edited_at: datetime | None = None


# ---------- Habits


class HabitIn(CamelModel):
    name: str = Field(min_length=3, max_length=60)
    category: str = Field(pattern="^(wake|hydration|activity|sleep|mindfulness|journaling|reading|growth)$")
    time: HHMM
    frequency: list[int] = Field(min_length=1, max_length=14)
    reminder: bool = False

    @field_validator("frequency")
    @classmethod
    def _freq(cls, v: list[int]) -> list[int]:
        return clean_freq(v)


class HabitPatch(CamelModel):
    name: str | None = Field(None, min_length=3, max_length=60)
    category: str | None = Field(None, pattern="^(wake|hydration|activity|sleep|mindfulness|journaling|reading|growth)$")
    time: HHMM | None = None
    frequency: list[int] | None = Field(None, min_length=1, max_length=14)
    reminder: bool | None = None

    @field_validator("frequency")
    @classmethod
    def _freq(cls, v: list[int] | None) -> list[int] | None:
        return clean_freq(v) if v is not None else v


class HabitLogIn(CamelModel):
    status: str = Field(pattern="^(done|skipped)$")


class HabitOut(CamelModel):
    id: str
    name: str
    category: str
    time: str
    frequency: list[int]
    target: str
    reminder: bool
    status: str | None  # status on the requested date
    streak: int
    history: dict[str, str]  # YYYY-MM-DD → done|skipped (last 35 days)
    created_at: datetime


class DayStat(CamelModel):
    date: date
    done: int
    total: int
    pct: int


class RoutineStepIn(CamelModel):
    time: HHMM
    label: str = Field(min_length=1, max_length=40)
    icon: str = Field("Sparkles", max_length=30)


class RoutineStepOut(RoutineStepIn):
    id: str
    position: int


# ---------- Sleep


class SleepIn(CamelModel):
    bedtime: HHMM
    wake: HHMM
    quality: int = Field(ge=1, le=5)
    note: str | None = Field(None, max_length=280)


class SleepOut(CamelModel):
    id: str
    date: date
    bedtime: str
    wake: str
    hours: float
    quality: int
    note: str | None
