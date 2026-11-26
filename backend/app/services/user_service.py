import copy
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Conflict, ValidationFailed
from app.models import (
    AIConversation, AIMemory, Appointment, Consent, Habit, JournalEntry, MoodCheckin, Preferences, RoutineStep,
    SleepReflection, TacSession, User,
)
from app.schemas.auth import ConsentOut, ProfilePatch
from app.services.defaults import ALLOWED_PREF_VALUES, DEFAULT_PREFERENCES

CONSENT_TYPES = {"terms", "privacy", "ai_memory", "analytics"}


def update_profile(db: Session, user: User, patch: ProfilePatch) -> User:
    data = patch.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        email = data.pop("email").lower()
        if email != user.email:
            if db.scalar(select(User.id).where(User.email == email)):
                raise Conflict("That email is already in use", code="email_taken")
            user.email = email
    for k, v in data.items():
        if k in ("full_name", "name") and v is None:
            continue
        setattr(user.profile, k, v)
    db.commit()
    return user


def _deep_merge(base: dict, patch: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def _validate_prefs(p: dict, prefix: str = "") -> None:
    for k, v in p.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            _validate_prefs(v, key + ".")
        elif key in ALLOWED_PREF_VALUES and v not in ALLOWED_PREF_VALUES[key]:
            raise ValidationFailed(f"Invalid value for {key}", details=[{"field": key, "message": f"Must be one of {sorted(ALLOWED_PREF_VALUES[key])}"}])


def get_preferences(db: Session, user: User) -> dict:
    p = user.preferences
    return {**_deep_merge(DEFAULT_PREFERENCES, p.data or {}), "timezone": p.timezone}


def update_preferences(db: Session, user: User, patch: dict) -> dict:
    patch = dict(patch)
    tz = patch.pop("timezone", None)
    if tz is not None:
        try:
            ZoneInfo(tz)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValidationFailed("Unknown timezone", details=[{"field": "timezone", "message": "Use an IANA name such as Asia/Kolkata"}])
        user.preferences.timezone = tz
    known = {k: v for k, v in patch.items() if k in DEFAULT_PREFERENCES}  # ignore unknown keys
    _validate_prefs(known)
    user.preferences.data = _deep_merge(user.preferences.data or {}, known)
    if "ai" in known and "personalMemory" in known["ai"]:
        set_consent(db, user, "ai_memory", bool(known["ai"]["personalMemory"]), commit=False)
    db.commit()
    return get_preferences(db, user)


def list_consents(db: Session, user: User) -> list[ConsentOut]:
    rows = db.scalars(select(Consent).where(Consent.user_id == user.id).order_by(Consent.type)).all()
    return [ConsentOut.model_validate(r) for r in rows]


def set_consent(db: Session, user: User, ctype: str, granted: bool, commit: bool = True) -> ConsentOut:
    if ctype not in CONSENT_TYPES:
        raise ValidationFailed("Unknown consent type")
    c = db.scalar(select(Consent).where(Consent.user_id == user.id, Consent.type == ctype))
    if c is None:
        c = Consent(user_id=user.id, type=ctype, granted=granted)
        db.add(c)
    else:
        c.granted = granted
    if ctype == "ai_memory":
        prefs = user.preferences
        prefs.data = _deep_merge(prefs.data or {}, {"ai": {"personalMemory": granted}})
    if commit:
        db.commit()
    db.flush()
    return ConsentOut.model_validate(c)


def export_data(db: Session, user: User) -> dict:
    """GDPR/DPDP-style export: everything we hold about the user, decrypted."""
    from app.services import ai_service, tac_service  # avoid import cycles
    from app.services.auth_service import user_out

    uid = user.id
    return {
        "user": user_out(user).model_dump(mode="json", by_alias=True),
        "preferences": get_preferences(db, user),
        "consents": [c.model_dump(mode="json", by_alias=True) for c in list_consents(db, user)],
        "checkins": [{"emotion": c.emotion, "intensity": c.intensity, "note": c.note, "triggers": c.triggers, "at": c.created_at.isoformat()} for c in db.scalars(select(MoodCheckin).where(MoodCheckin.user_id == uid))],
        "journal": [{"title": j.title, "body": j.body, "mood": j.mood, "tags": j.tags, "at": j.created_at.isoformat()} for j in db.scalars(select(JournalEntry).where(JournalEntry.user_id == uid))],
        "habits": [{"name": h.name, "category": h.category, "time": h.time, "frequency": h.frequency, "logs": {str(l.date): l.status for l in h.logs}} for h in db.scalars(select(Habit).where(Habit.user_id == uid))],
        "routine": [{"time": r.time, "label": r.label} for r in db.scalars(select(RoutineStep).where(RoutineStep.user_id == uid))],
        "sleep": [{"date": str(s.date), "bedtime": s.bedtime, "wake": s.wake, "hours": s.hours, "quality": s.quality, "note": s.note} for s in db.scalars(select(SleepReflection).where(SleepReflection.user_id == uid))],
        "decisions": [tac_service.to_out(d).model_dump(mode="json", by_alias=True) for d in db.scalars(select(TacSession).where(TacSession.user_id == uid))],
        "aiConversations": [ai_service.conversation_out(c).model_dump(mode="json", by_alias=True) for c in db.scalars(select(AIConversation).where(AIConversation.user_id == uid))],
        "aiMemories": [{"label": m.label, "enabled": m.enabled} for m in db.scalars(select(AIMemory).where(AIMemory.user_id == uid))],
        "appointments": [{"ref": a.ref, "professional": a.professional.name, "type": a.type, "startsAt": a.starts_at.isoformat(), "status": a.status} for a in db.scalars(select(Appointment).where(Appointment.user_id == uid))],
    }


def delete_account(db: Session, user: User) -> None:
    # Appointments reference professionals with RESTRICT, but users with CASCADE — a plain delete removes everything.
    db.delete(user)
    db.commit()


def ensure_prefs(db: Session, user: User) -> Preferences:
    if user.preferences is None:
        user.preferences = Preferences(data={})
        db.commit()
    return user.preferences
