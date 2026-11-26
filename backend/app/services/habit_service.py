from datetime import date, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ValidationFailed
from app.models import Habit, HabitCompletion, RoutineStep, User
from app.schemas.wellbeing import DayStat, HabitIn, HabitOut, HabitPatch, RoutineStepIn, RoutineStepOut
from app.services.common import day_range, get_owned, js_weekday, local_today

HISTORY_DAYS = 35


def target_label(freq: list[int]) -> str:
    s = set(freq)
    if len(s) == 7:
        return "Daily"
    if s == {1, 2, 3, 4, 5}:
        return "Weekdays"
    if s == {0, 6}:
        return "Weekends"
    return f"{len(s)}× a week"


def streak(habit: Habit, logs: dict[date, str], today: date) -> int:
    """Consecutive scheduled days marked done. Today not-yet-done doesn't break it;
    unscheduled days are skipped over."""
    n = 0
    d = today
    for _ in range(366):
        s = logs.get(d)
        if s == "done":
            n += 1
        elif d == today or js_weekday(d) not in habit.frequency:
            pass
        else:
            break
        d -= timedelta(days=1)
    return n


def _out(h: Habit, on: date, today: date) -> HabitOut:
    logs = {l.date: l.status for l in h.logs}
    start = today - timedelta(days=HISTORY_DAYS)
    return HabitOut(
        id=h.id, name=h.name, category=h.category, time=h.time, frequency=h.frequency, target=target_label(h.frequency),
        reminder=h.reminder, status=logs.get(on), streak=streak(h, logs, today),
        history={str(d): s for d, s in logs.items() if d >= start}, created_at=h.created_at,
    )


def _habits(db: Session, user: User) -> list[Habit]:
    return db.scalars(
        select(Habit).where(Habit.user_id == user.id, Habit.archived.is_(False)).options(selectinload(Habit.logs)).order_by(Habit.time, Habit.created_at)
    ).all()


def list_(db: Session, user: User, on: date | None) -> list[HabitOut]:
    today = local_today(db, user)
    return [_out(h, on or today, today) for h in _habits(db, user)]


def create(db: Session, user: User, data: HabitIn) -> HabitOut:
    h = Habit(user_id=user.id, **data.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    today = local_today(db, user)
    return _out(h, today, today)


def update(db: Session, user: User, hid: str, patch: HabitPatch) -> HabitOut:
    h = get_owned(db, Habit, hid, user.id, "Habit")
    for k, v in patch.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(h, k, v)
    db.commit()
    today = local_today(db, user)
    return _out(h, today, today)


def delete_(db: Session, user: User, hid: str) -> None:
    db.delete(get_owned(db, Habit, hid, user.id, "Habit"))
    db.commit()


def set_log(db: Session, user: User, hid: str, day: date, status: str) -> HabitOut:
    h = get_owned(db, Habit, hid, user.id, "Habit")
    today = local_today(db, user)
    if day > today:
        raise ValidationFailed("You can’t log a habit for a future date")
    if day < today - timedelta(days=60):
        raise ValidationFailed("Logs older than 60 days can’t be changed")
    log = db.scalar(select(HabitCompletion).where(HabitCompletion.habit_id == h.id, HabitCompletion.date == day))
    if log:
        log.status = status
    else:
        db.add(HabitCompletion(habit_id=h.id, date=day, status=status))
    db.commit()
    db.refresh(h)
    return _out(h, day, today)


def clear_log(db: Session, user: User, hid: str, day: date) -> HabitOut:
    h = get_owned(db, Habit, hid, user.id, "Habit")
    db.execute(delete(HabitCompletion).where(HabitCompletion.habit_id == h.id, HabitCompletion.date == day))
    db.commit()
    db.refresh(h)
    today = local_today(db, user)
    return _out(h, day, today)


def day_stats(habits: list[Habit], days: list[date]) -> list[DayStat]:
    by_habit = {h.id: {l.date: l.status for l in h.logs} for h in habits}
    out = []
    for d in days:
        # Counts on days it existed, plus any day the user explicitly backfilled a log for.
        scheduled = [h for h in habits if js_weekday(d) in h.frequency and (h.created_at.date() <= d or d in by_habit[h.id])]
        done = sum(1 for h in scheduled if by_habit[h.id].get(d) == "done")
        out.append(DayStat(date=d, done=done, total=len(scheduled), pct=round(done / len(scheduled) * 100) if scheduled else 0))
    return out


def stats(db: Session, user: User, days: int) -> list[DayStat]:
    return day_stats(_habits(db, user), day_range(local_today(db, user), days))


# ---------- Routine


def get_routine(db: Session, user: User) -> list[RoutineStepOut]:
    rows = db.scalars(select(RoutineStep).where(RoutineStep.user_id == user.id).order_by(RoutineStep.position)).all()
    return [RoutineStepOut.model_validate(r) for r in rows]


def put_routine(db: Session, user: User, steps: list[RoutineStepIn]) -> list[RoutineStepOut]:
    if len(steps) > 20:
        raise ValidationFailed("A routine can have up to 20 steps")
    db.execute(delete(RoutineStep).where(RoutineStep.user_id == user.id))
    for i, s in enumerate(sorted(steps, key=lambda s: s.time)):
        db.add(RoutineStep(user_id=user.id, position=i, **s.model_dump()))
    db.commit()
    return get_routine(db, user)
