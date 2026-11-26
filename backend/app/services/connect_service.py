import secrets
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError, Conflict, NotFound, ValidationFailed
from app.models import Appointment, Notification, Professional, Review, User
from app.models.connect import CONSULT_DURATION_MIN, CONSULT_TYPES
from app.schemas.base import Page
from app.schemas.connect import AppointmentIn, AppointmentOut, CredentialOut, ProfessionalDetail, ProfessionalOut, ReviewIn, ReviewOut, Slot
from app.services.common import get_owned, js_weekday

BOOKING_HORIZON_DAYS = 30


def _slot_times(p: Professional, d: date) -> list[str]:
    out: list[str] = []
    for rule in sorted(p.availability, key=lambda r: r.start_time):
        if rule.weekday != js_weekday(d):
            continue
        sh, sm = map(int, rule.start_time.split(":"))
        eh, em = map(int, rule.end_time.split(":"))
        t, end = sh * 60 + sm, eh * 60 + em
        while t + 50 <= end:  # session must fit in the window
            out.append(f"{t // 60:02d}:{t % 60:02d}")
            t += rule.slot_minutes
    return out


def _starts_at(p: Professional, d: date, hhmm: str) -> datetime:
    h, m = map(int, hhmm.split(":"))
    return datetime(d.year, d.month, d.day, h, m, tzinfo=ZoneInfo(p.timezone)).astimezone(timezone.utc)


def _booked(db: Session, p: Professional, d: date) -> set[str]:
    tz = ZoneInfo(p.timezone)
    start = datetime(d.year, d.month, d.day, tzinfo=tz)
    rows = db.scalars(
        select(Appointment.starts_at).where(Appointment.professional_id == p.id, Appointment.status == "confirmed", Appointment.starts_at >= start, Appointment.starts_at < start + timedelta(days=1))
    )
    return {dt.astimezone(tz).strftime("%H:%M") for dt in rows}


def slots(db: Session, p: Professional, d: date) -> list[Slot]:
    now = datetime.now(timezone.utc)
    booked = _booked(db, p, d)
    return [Slot(time=t, available=t not in booked and _starts_at(p, d, t) > now + timedelta(minutes=30)) for t in _slot_times(p, d)]


def _next_slot(db: Session, p: Professional) -> str | None:
    tz = ZoneInfo(p.timezone)
    today = datetime.now(tz).date()
    for i in range(14):
        d = today + timedelta(days=i)
        free = [s for s in slots(db, p, d) if s.available]
        if free:
            label = "Today" if i == 0 else "Tomorrow" if i == 1 else d.strftime("%a")
            h, m = map(int, free[0].time.split(":"))
            return f"{label}, {(h % 12) or 12}:{m:02d} {'PM' if h >= 12 else 'AM'}"
    return None


def _out(db: Session, p: Professional) -> ProfessionalOut:
    nxt = _next_slot(db, p)
    return ProfessionalOut(
        id=p.id, slug=p.slug, name=p.name, designation=p.designation, specializations=p.specializations,
        qualifications=[c.title for c in p.credentials if c.kind == "qualification"],
        registration=next((f"{c.title} {c.number or ''}".strip() for c in p.credentials if c.kind == "registration"), None),
        experience=p.experience_years, languages=p.languages, rating=round(p.rating_avg, 1), reviews_count=p.reviews_count,
        fee=p.base_fee, modes=p.modes, avatar=p.avatar, available=bool(nxt and nxt.startswith(("Today", "Tomorrow"))), next_slot=nxt, is_sample=p.is_sample,
    )


def get_pro(db: Session, pid: str) -> Professional:
    p = db.scalar(select(Professional).where((Professional.id == pid) | (Professional.slug == pid), Professional.is_active.is_(True)))
    if p is None:
        raise NotFound("Professional")
    return p


def list_pros(db: Session, q: str | None, topic: str | None, language: str | None, mode: str | None, max_fee: int | None, available: bool, sort: str) -> list[ProfessionalOut]:
    rows = db.scalars(select(Professional).where(Professional.is_active.is_(True))).all()
    out = []
    for p in rows:
        hay = f"{p.name} {p.designation} {' '.join(p.specializations)}".lower()
        if q and q.lower() not in hay:
            continue
        if topic and topic not in p.specializations:
            continue
        if language and language not in p.languages:
            continue
        if mode and mode not in p.modes:
            continue
        if max_fee is not None and p.base_fee > max_fee:
            continue
        o = _out(db, p)
        if available and not o.available:
            continue
        out.append(o)
    key = {"fee": lambda o: o.fee, "experience": lambda o: -o.experience}.get(sort, lambda o: -o.rating)
    return sorted(out, key=key)


def detail(db: Session, pid: str) -> ProfessionalDetail:
    p = get_pro(db, pid)
    base = _out(db, p).model_dump()
    return ProfessionalDetail(
        **base, bio=p.bio, approach=p.approach, credentials=[CredentialOut.model_validate(c) for c in p.credentials],
        pricing={t: price_for(p, t) for t in p.modes},
    )


def reviews(db: Session, pid: str, limit: int, offset: int) -> Page[ReviewOut]:
    p = get_pro(db, pid)
    q = select(Review).where(Review.professional_id == p.id)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    rows = db.scalars(q.order_by(Review.created_at.desc()).limit(limit).offset(offset)).all()
    return Page[ReviewOut](items=[ReviewOut.model_validate(r) for r in rows], total=total, limit=limit, offset=offset)


def price_for(p: Professional, ctype: str) -> int:
    return round(p.base_fee * CONSULT_TYPES[ctype])


def appt_out(a: Appointment) -> AppointmentOut:
    tz = ZoneInfo(a.professional.timezone)
    local = a.starts_at.astimezone(tz)
    return AppointmentOut(
        id=a.id, ref=a.ref, professional_id=a.professional_id, pro_name=a.professional.name, avatar=a.professional.avatar, type=a.type,
        starts_at=a.starts_at, date=local.date(), time=local.strftime("%H:%M"), duration_min=a.duration_min, price=a.price,
        status=a.status, note=a.note, created_at=a.created_at,
    )


def book(db: Session, user: User, data: AppointmentIn) -> AppointmentOut:
    p = get_pro(db, data.professional_id)
    if data.type not in p.modes:
        raise ValidationFailed(f"{p.name} doesn’t offer {data.type} consultations")
    tz = ZoneInfo(p.timezone)
    today = datetime.now(tz).date()
    if data.date < today or data.date > today + timedelta(days=BOOKING_HORIZON_DAYS):
        raise ValidationFailed(f"Choose a date within the next {BOOKING_HORIZON_DAYS} days")
    slot = next((s for s in slots(db, p, data.date) if s.time == data.time), None)
    if slot is None:
        raise ValidationFailed("That time isn’t in this professional’s schedule")
    if not slot.available:
        raise Conflict("That slot was just taken — please pick another time", code="slot_unavailable")
    starts = _starts_at(p, data.date, data.time)
    a = Appointment(
        user_id=user.id, professional_id=p.id, type=data.type, starts_at=starts, duration_min=CONSULT_DURATION_MIN[data.type],
        price=price_for(p, data.type), status="confirmed", active_slot=starts.strftime("%Y-%m-%dT%H:%M"), note=data.note,
        ref="AID-" + secrets.token_hex(3).upper(),
    )
    db.add(a)
    db.add(Notification(user_id=user.id, kind="session", title=f"Session booked with {p.name}", body=f"{data.date.strftime('%a %d %b')} at {data.time} · ref {a.ref}", link="/connect"))
    try:
        db.commit()
    except IntegrityError:  # concurrent booking hit the unique (professional, active_slot) index
        db.rollback()
        raise Conflict("That slot was just taken — please pick another time", code="slot_unavailable")
    return appt_out(a)


def list_appts(db: Session, user: User) -> list[AppointmentOut]:
    rows = db.scalars(select(Appointment).where(Appointment.user_id == user.id).order_by(Appointment.starts_at.desc())).all()
    return [appt_out(a) for a in rows]


def get_appt(db: Session, user: User, aid: str) -> AppointmentOut:
    return appt_out(get_owned(db, Appointment, aid, user.id, "Appointment"))


def cancel(db: Session, user: User, aid: str) -> AppointmentOut:
    a = get_owned(db, Appointment, aid, user.id, "Appointment")
    if a.status != "confirmed":
        raise Conflict(f"This appointment is already {a.status}")
    if a.starts_at <= datetime.now(timezone.utc):
        raise Conflict("Past appointments can’t be cancelled")
    a.status = "cancelled"
    a.active_slot = None  # frees the slot for others
    db.commit()
    return appt_out(a)


def review(db: Session, user: User, aid: str, data: ReviewIn) -> ReviewOut:
    a = get_owned(db, Appointment, aid, user.id, "Appointment")
    if a.status == "cancelled" or a.starts_at > datetime.now(timezone.utc):
        raise AppError("You can review a session after it has taken place", code="not_reviewable", status_code=409)
    if db.scalar(select(Review.id).where(Review.appointment_id == a.id)):
        raise Conflict("You’ve already reviewed this session")
    r = Review(professional_id=a.professional_id, user_id=user.id, appointment_id=a.id, display_name=f"{user.profile.name[:1]}.", rating=data.rating, text=data.text)
    db.add(r)
    p = a.professional
    p.rating_avg = (p.rating_avg * p.reviews_count + data.rating) / (p.reviews_count + 1)
    p.reviews_count += 1
    if a.status == "confirmed":
        a.status = "completed"
        a.active_slot = None
    db.commit()
    return ReviewOut.model_validate(r)
