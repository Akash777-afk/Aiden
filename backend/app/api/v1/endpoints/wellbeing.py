from datetime import date

from fastapi import APIRouter, Query, Response

from app.api.deps import DB, CurrentUser
from app.schemas.base import Page
from app.schemas.wellbeing import (
    CheckinIn, CheckinOut, CheckinSummary, DayStat, HabitIn, HabitLogIn, HabitOut, HabitPatch, JournalIn, JournalOut,
    JournalPatch, RoutineStepIn, RoutineStepOut, SleepIn, SleepOut,
)
from app.services import checkin_service, habit_service, journal_service, sleep_service

router = APIRouter()

# ---------- Check-ins


@router.get("/checkins", response_model=Page[CheckinOut], tags=["pulse"])
def list_checkins(db: DB, user: CurrentUser, from_: date | None = Query(None, alias="from"), to: date | None = None, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return checkin_service.list_(db, user, from_, to, limit, offset)


@router.post("/checkins", response_model=CheckinOut, status_code=201, tags=["pulse"])
def create_checkin(data: CheckinIn, db: DB, user: CurrentUser):
    return checkin_service.create(db, user, data)


@router.get("/checkins/summary", response_model=CheckinSummary, tags=["pulse"])
def checkin_summary(db: DB, user: CurrentUser, days: int = Query(7, ge=1, le=365)):
    return checkin_service.summary(db, user, days)


@router.delete("/checkins/{cid}", status_code=204, tags=["pulse"])
def delete_checkin(cid: str, db: DB, user: CurrentUser):
    checkin_service.delete(db, user, cid)
    return Response(status_code=204)


# ---------- Journal


@router.get("/journal", response_model=Page[JournalOut], tags=["journal"])
def list_journal(db: DB, user: CurrentUser, q: str | None = Query(None, max_length=100), tag: str | None = None, from_: date | None = Query(None, alias="from"), to: date | None = None, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    return journal_service.list_(db, user, q, tag, from_, to, limit, offset)


@router.get("/journal/tags", response_model=list[str], tags=["journal"])
def journal_tags(db: DB, user: CurrentUser):
    return journal_service.tags(db, user)


@router.post("/journal", response_model=JournalOut, status_code=201, tags=["journal"])
def create_entry(data: JournalIn, db: DB, user: CurrentUser):
    return journal_service.create(db, user, data)


@router.get("/journal/{eid}", response_model=JournalOut, tags=["journal"])
def get_entry(eid: str, db: DB, user: CurrentUser):
    return journal_service.get(db, user, eid)


@router.patch("/journal/{eid}", response_model=JournalOut, tags=["journal"])
def patch_entry(eid: str, data: JournalPatch, db: DB, user: CurrentUser):
    return journal_service.update(db, user, eid, data)


@router.delete("/journal/{eid}", status_code=204, tags=["journal"])
def delete_entry(eid: str, db: DB, user: CurrentUser):
    journal_service.delete(db, user, eid)
    return Response(status_code=204)


# ---------- Habits & routine


@router.get("/habits", response_model=list[HabitOut], tags=["rhythm"])
def list_habits(db: DB, user: CurrentUser, on: date | None = Query(None, alias="date")):
    return habit_service.list_(db, user, on)


@router.post("/habits", response_model=HabitOut, status_code=201, tags=["rhythm"])
def create_habit(data: HabitIn, db: DB, user: CurrentUser):
    return habit_service.create(db, user, data)


@router.get("/habits/stats", response_model=list[DayStat], tags=["rhythm"])
def habit_stats(db: DB, user: CurrentUser, days: int = Query(7, ge=1, le=90)):
    return habit_service.stats(db, user, days)


@router.patch("/habits/{hid}", response_model=HabitOut, tags=["rhythm"])
def patch_habit(hid: str, data: HabitPatch, db: DB, user: CurrentUser):
    return habit_service.update(db, user, hid, data)


@router.delete("/habits/{hid}", status_code=204, tags=["rhythm"])
def delete_habit(hid: str, db: DB, user: CurrentUser):
    habit_service.delete_(db, user, hid)
    return Response(status_code=204)


@router.put("/habits/{hid}/logs/{day}", response_model=HabitOut, tags=["rhythm"])
def put_log(hid: str, day: date, data: HabitLogIn, db: DB, user: CurrentUser):
    return habit_service.set_log(db, user, hid, day, data.status)


@router.delete("/habits/{hid}/logs/{day}", response_model=HabitOut, tags=["rhythm"])
def delete_log(hid: str, day: date, db: DB, user: CurrentUser):
    return habit_service.clear_log(db, user, hid, day)


@router.get("/routine", response_model=list[RoutineStepOut], tags=["rhythm"])
def get_routine(db: DB, user: CurrentUser):
    return habit_service.get_routine(db, user)


@router.put("/routine", response_model=list[RoutineStepOut], tags=["rhythm"])
def put_routine(steps: list[RoutineStepIn], db: DB, user: CurrentUser):
    return habit_service.put_routine(db, user, steps)


# ---------- Sleep


@router.get("/sleep/logs", response_model=list[SleepOut], tags=["sleep"])
def sleep_logs(db: DB, user: CurrentUser, days: int = Query(30, ge=1, le=365)):
    return sleep_service.list_(db, user, days)


@router.put("/sleep/logs/{night}", response_model=SleepOut, tags=["sleep"])
def put_sleep(night: date, data: SleepIn, db: DB, user: CurrentUser):
    return sleep_service.upsert(db, user, night, data)


@router.delete("/sleep/logs/{night}", status_code=204, tags=["sleep"])
def delete_sleep(night: date, db: DB, user: CurrentUser):
    sleep_service.delete_(db, user, night)
    return Response(status_code=204)


@router.get("/sleep/favorites", response_model=list[str], tags=["sleep"])
def get_favs(db: DB, user: CurrentUser):
    return sleep_service.get_favorites(db, user)


@router.put("/sleep/favorites", response_model=list[str], tags=["sleep"])
def put_favs(ids: list[str], db: DB, user: CurrentUser):
    return sleep_service.put_favorites(db, user, ids)
