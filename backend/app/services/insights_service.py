"""Wellbeing analytics computed from the user's own records."""

from collections import defaultdict
from datetime import timedelta
from statistics import mean

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import AIConversation, Habit, JournalEntry, MoodCheckin, SleepReflection, TacSession, User
from app.schemas.misc import Growth, HabitPoint, InsightsOut, InsightStats, JournalPoint, MoodPoint, SleepPoint
from app.services.checkin_service import streak as checkin_streak
from app.services.common import day_range, local_date, local_day_bounds_utc, local_today, user_tz
from app.services.defaults import EMOTION_SCORE
from app.services.habit_service import day_stats


def _pct_delta(cur: float | None, prev: float | None) -> int | None:
    if cur is None or not prev:
        return None
    return round((cur - prev) / prev * 100)


def compute(db: Session, user: User, days: int) -> InsightsOut:
    tz = user_tz(db, user)
    today = local_today(db, user)
    window = day_range(today, days)
    prev_window = day_range(today - timedelta(days=days), days)
    since = local_day_bounds_utc(prev_window[0], tz)[0]

    # Mood
    checkins = db.scalars(select(MoodCheckin).where(MoodCheckin.user_id == user.id, MoodCheckin.created_at >= since)).all()
    by_day: dict = defaultdict(list)
    for c in checkins:
        by_day[local_date(c.created_at, tz)].append(EMOTION_SCORE.get(c.emotion, 3))
    mood = [MoodPoint(date=d, score=round(mean(by_day[d]), 1) if by_day[d] else None, count=len(by_day[d])) for d in window]
    cur_scores = [s for d in window for s in by_day[d]]
    prev_scores = [s for d in prev_window for s in by_day[d]]
    avg_mood = round(mean(cur_scores), 2) if cur_scores else None

    # Habits
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id, Habit.archived.is_(False)).options(selectinload(Habit.logs))).all()
    hs = day_stats(habits, window)
    hs_prev = day_stats(habits, prev_window)
    habit_pct = round(mean(h.pct for h in hs)) if habits else None
    habit_prev = mean(h.pct for h in hs_prev) if habits else None

    # Sleep
    logs = {s.date: s for s in db.scalars(select(SleepReflection).where(SleepReflection.user_id == user.id, SleepReflection.date >= window[0]))}
    sleep = [SleepPoint(date=d, hours=logs[d].hours if d in logs else None, quality=logs[d].quality if d in logs else None) for d in window]
    hours = [s.hours for s in sleep if s.hours is not None]

    # Journal
    entries = db.scalars(select(JournalEntry.created_at).where(JournalEntry.user_id == user.id, JournalEntry.created_at >= local_day_bounds_utc(window[0], tz)[0])).all()
    edays = [local_date(dt, tz) for dt in entries]
    if days <= 7:
        journal = [JournalPoint(label=d.strftime("%a"), entries=edays.count(d)) for d in window]
    else:
        journal = []
        for w in range(4):
            start = today - timedelta(days=(3 - w) * 7 + 6)
            end = start + timedelta(days=6)
            journal.append(JournalPoint(label=f"Wk {w + 1}", entries=sum(1 for d in edays if start <= d <= end)))

    # Streak across the last year
    all_days = {local_date(dt, tz) for dt in db.scalars(select(MoodCheckin.created_at).where(MoodCheckin.user_id == user.id, MoodCheckin.created_at >= local_day_bounds_utc(today - timedelta(days=366), tz)[0]))}

    week_start = local_day_bounds_utc(today - timedelta(days=6), tz)[0]
    growth = Growth(
        chat=bool(db.scalar(select(AIConversation.id).where(AIConversation.user_id == user.id, AIConversation.updated_at >= week_start).limit(1))),
        habit=any(s.done for s in hs[-7:]),
        sleep=any(s.hours is not None for s in sleep[-7:]),
        reflect=any(d >= today - timedelta(days=6) for d in edays),
        grow=bool(db.scalar(select(TacSession.id).where(TacSession.user_id == user.id, TacSession.updated_at >= week_start).limit(1))),
    )

    return InsightsOut(
        days=days,
        stats=InsightStats(
            avg_mood=avg_mood, mood_delta_pct=_pct_delta(avg_mood, mean(prev_scores) if prev_scores else None),
            habit_pct=habit_pct, habit_delta_pct=_pct_delta(habit_pct, habit_prev),
            avg_sleep=round(mean(hours), 1) if hours else None, journal_entries=len(edays), checkin_streak=checkin_streak(all_days, today),
        ),
        mood=mood, habits=[HabitPoint(date=h.date, pct=h.pct) for h in hs], sleep=sleep, journal=journal, growth=growth,
        patterns=_patterns(mood, hs, sleep),
    )


def _patterns(mood: list[MoodPoint], habits, sleep: list[SleepPoint]) -> list[str]:
    """Simple, honest correlations from the user's own data. Never causal claims."""
    out = []
    good_sleep = [m.score for m, s in zip(mood, sleep) if m.score is not None and s.hours is not None and s.hours >= 7]
    poor_sleep = [m.score for m, s in zip(mood, sleep) if m.score is not None and s.hours is not None and s.hours < 7]
    if len(good_sleep) >= 2 and len(poor_sleep) >= 2 and mean(good_sleep) > mean(poor_sleep) + 0.3:
        out.append("Your check-ins tend to be calmer after nights of 7+ hours of sleep.")
    hi = [m.score for m, h in zip(mood, habits) if m.score is not None and h.pct >= 70]
    lo = [m.score for m, h in zip(mood, habits) if m.score is not None and h.pct < 70]
    if len(hi) >= 2 and len(lo) >= 2 and mean(hi) > mean(lo) + 0.3:
        out.append("On days you complete most of your habits, your mood tends to be higher.")
    if not out:
        out.append("Keep checking in — patterns appear after a week or two of entries.")
    return out
