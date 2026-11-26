import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.endpoints import auth, features, wellbeing
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.db.session import SessionLocal, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("aiden")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Local SQLite convenience only. MySQL schemas are managed by Alembic migrations (Phase 3).
    if settings.DATABASE_URL.startswith("sqlite") and settings.ENVIRONMENT in ("development", "test"):
        from app.db.base import Base
        from app.db.seed import seed_catalog
        import app.models  # noqa: F401  (register models)

        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            seed_catalog(db)
    log.info("AIDEN API %s started (%s)", settings.VERSION, settings.ENVIRONMENT)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="Backend for AIDEN — *A better connection with yourself.* See docs/API_CONTRACT.md.",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "no-referrer")
        if request.url.path.startswith(settings.API_PREFIX):
            resp.headers.setdefault("Cache-Control", "no-store")  # personal data must not be cached
        return resp

    register_error_handlers(app)

    api = APIRouter(prefix=settings.API_PREFIX)

    @api.get("/health", tags=["system"])
    def health():
        db_ok = "ok"
        try:
            with engine.connect() as c:
                c.execute(text("SELECT 1"))
        except Exception:  # noqa: BLE001
            db_ok = "unavailable"
        return {"status": "ok" if db_ok == "ok" else "degraded", "version": settings.VERSION, "db": db_ok}

    api.include_router(auth.router)
    api.include_router(wellbeing.router)
    api.include_router(features.router)
    app.include_router(api)
    return app


app = create_app()
