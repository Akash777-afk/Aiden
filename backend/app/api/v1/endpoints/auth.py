from fastapi import APIRouter, Request, Response, status

from app.api.deps import DB, CurrentUser, client_ip, login_limiter, register_limiter
from app.schemas.auth import AuthOut, ConsentIn, ConsentOut, LoginIn, ProfilePatch, RefreshIn, RegisterIn, TokenPair, UserOut
from app.services import auth_service, user_service

router = APIRouter()


@router.post("/auth/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED, tags=["auth"])
def register(data: RegisterIn, db: DB, request: Request):
    register_limiter.hit(f"reg:{client_ip(request)}")
    return auth_service.register(db, data)


@router.post("/auth/login", response_model=AuthOut, tags=["auth"])
def login(data: LoginIn, db: DB, request: Request):
    login_limiter.hit(f"login:{data.email.lower()}:{client_ip(request)}")
    return auth_service.login(db, data.email, data.password)


@router.post("/auth/refresh", response_model=TokenPair, tags=["auth"])
def refresh(data: RefreshIn, db: DB):
    return auth_service.refresh(db, data.refresh_token)


@router.post("/auth/logout", status_code=204, tags=["auth"])
def logout(data: RefreshIn, db: DB, user: CurrentUser):
    auth_service.logout(db, data.refresh_token, user)
    return Response(status_code=204)


@router.get("/auth/me", response_model=UserOut, tags=["auth"])
def me(user: CurrentUser):
    return auth_service.user_out(user)


# ---------- Profile & preferences


@router.get("/users/me", response_model=UserOut, tags=["users"])
def get_me(user: CurrentUser):
    return auth_service.user_out(user)


@router.patch("/users/me", response_model=UserOut, tags=["users"])
def patch_me(patch: ProfilePatch, db: DB, user: CurrentUser):
    return auth_service.user_out(user_service.update_profile(db, user, patch))


@router.delete("/users/me", status_code=204, tags=["users"])
def delete_me(db: DB, user: CurrentUser):
    user_service.delete_account(db, user)
    return Response(status_code=204)


@router.get("/users/me/preferences", tags=["users"])
def get_prefs(db: DB, user: CurrentUser) -> dict:
    return user_service.get_preferences(db, user)


@router.patch("/users/me/preferences", tags=["users"])
def patch_prefs(patch: dict, db: DB, user: CurrentUser) -> dict:
    return user_service.update_preferences(db, user, patch)


@router.get("/users/me/consents", response_model=list[ConsentOut], tags=["users"])
def consents(db: DB, user: CurrentUser):
    return user_service.list_consents(db, user)


@router.put("/users/me/consents/{ctype}", response_model=ConsentOut, tags=["users"])
def put_consent(ctype: str, data: ConsentIn, db: DB, user: CurrentUser):
    return user_service.set_consent(db, user, ctype, data.granted)


@router.get("/users/me/export", tags=["users"])
def export(db: DB, user: CurrentUser) -> dict:
    return user_service.export_data(db, user)
