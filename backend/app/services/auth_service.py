from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.errors import Conflict, Unauthorized
from app.models import Consent, Notification, Preferences, Profile, RefreshToken, RoutineStep, User
from app.schemas.auth import AuthOut, RegisterIn, TokenPair, UserOut
from app.services.defaults import DEFAULT_PREFERENCES, DEFAULT_ROUTINE

_DUMMY_HASH = security.hash_password("timing-equaliser-not-a-real-password-1")

DEFAULT_AVATAR ={"skin": "#B98261", "hair": "#1D1412", "style": "short", "shirt": "#8B72C7", "bg": "#E9DFFB"}


def user_out(user: User) -> UserOut:
    p = user.profile
    return UserOut(
        id=user.id, email=user.email, full_name=p.full_name, name=p.name, phone=p.phone, city=p.city, dob=p.dob,
        pronouns=p.pronouns, avatar=p.avatar, photo_url=p.photo_url, joined_at=user.created_at,
    )


def _issue_tokens(db: Session, user: User) -> TokenPair:
    access, expires_in = security.create_access_token(user.id)
    raw = security.new_refresh_token()
    db.add(RefreshToken(user_id=user.id, token_hash=security.hash_token(raw), expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_DAYS)))
    return TokenPair(access_token=access, refresh_token=raw, expires_in=expires_in)


def register(db: Session, data: RegisterIn) -> AuthOut:
    email = data.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise Conflict("An account with this email already exists", code="email_taken")
    user = User(email=email, password_hash=security.hash_password(data.password))
    first = data.full_name.split()[0][:24]
    user.profile = Profile(full_name=data.full_name, name=first, avatar=DEFAULT_AVATAR)
    user.preferences = Preferences(timezone=settings.DEFAULT_TIMEZONE, data=DEFAULT_PREFERENCES)
    db.add(user)
    db.flush()
    for t in ("terms", "privacy"):
        db.add(Consent(user_id=user.id, type=t, granted=True))
    db.add(Consent(user_id=user.id, type="ai_memory", granted=True))
    for i, s in enumerate(DEFAULT_ROUTINE):
        db.add(RoutineStep(user_id=user.id, position=i, **s))
    db.add(Notification(user_id=user.id, kind="system", title=f"Welcome to AIDEN, {first}", body="Start with a quick check-in — how are you feeling today?", link="/pulse"))
    tokens = _issue_tokens(db, user)
    db.commit()
    return AuthOut(**tokens.model_dump(), user=user_out(user))


def login(db: Session, email: str, password: str) -> AuthOut:
    user = db.scalar(select(User).where(User.email == email.lower()))
    # Verify even when the user is missing to keep timing similar (no account enumeration).
    ok = security.verify_password(password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok or not user.is_active:
        raise Unauthorized("Incorrect email or password", code="invalid_credentials")
    if security.needs_rehash(user.password_hash):
        user.password_hash = security.hash_password(password)
    user.last_login_at = datetime.now(timezone.utc)
    tokens = _issue_tokens(db, user)
    db.commit()
    return AuthOut(**tokens.model_dump(), user=user_out(user))


def refresh(db: Session, raw_token: str) -> TokenPair:
    th = security.hash_token(raw_token)
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == th))
    now = datetime.now(timezone.utc)
    if rt is None:
        raise Unauthorized("Invalid refresh token")
    if rt.revoked_at is not None:
        # Reuse of a rotated token = likely theft → revoke every session of this user.
        db.execute(update(RefreshToken).where(RefreshToken.user_id == rt.user_id, RefreshToken.revoked_at.is_(None)).values(revoked_at=now))
        db.commit()
        raise Unauthorized("Session expired, please sign in again", code="token_reused")
    if rt.expires_at < now:
        raise Unauthorized("Session expired, please sign in again")
    user = db.get(User, rt.user_id)
    if not user or not user.is_active:
        raise Unauthorized("Account unavailable")
    rt.revoked_at = now
    tokens = _issue_tokens(db, user)
    db.commit()
    return tokens


def logout(db: Session, raw_token: str, user: User) -> None:
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == security.hash_token(raw_token), RefreshToken.user_id == user.id))
    if rt and rt.revoked_at is None:
        rt.revoked_at = datetime.now(timezone.utc)
        db.commit()
