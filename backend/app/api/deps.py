from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import Unauthorized
from app.core.ratelimit import SlidingWindowLimiter
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User

_bearer = HTTPBearer(auto_error=False)
login_limiter = SlidingWindowLimiter(settings.LOGIN_RATE_LIMIT, settings.LOGIN_RATE_WINDOW_SECONDS)
register_limiter = SlidingWindowLimiter(20, 3600)

DB = Annotated[Session, Depends(get_db)]


def current_user(db: DB, creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise Unauthorized("Sign in to continue")
    uid = decode_access_token(creds.credentials)
    if not uid:
        raise Unauthorized("Your session has expired", code="token_expired")
    user = db.get(User, uid)
    if user is None or not user.is_active:
        raise Unauthorized("Account unavailable")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"
