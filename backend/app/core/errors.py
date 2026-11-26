import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("aiden")


class AppError(Exception):
    """Domain error rendered in the contract's error envelope."""

    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None, details: list | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or []
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code


class NotFound(AppError):
    status_code = 404
    code = "not_found"

    def __init__(self, what: str = "Resource"):
        super().__init__(f"{what} not found")


class Conflict(AppError):
    status_code = 409
    code = "conflict"


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class RateLimited(AppError):
    status_code = 429
    code = "rate_limited"


class ValidationFailed(AppError):
    status_code = 422
    code = "validation_error"


def _envelope(status: int, code: str, message: str, details: list | None = None, headers: dict | None = None):
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message, "details": details or []}}, headers=headers)


def _camel(s: str) -> str:
    head, *tail = s.split("_")
    return head + "".join(t.title() for t in tail)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
        return _envelope(exc.status_code, exc.code, exc.message, exc.details, headers)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        details = []
        for e in exc.errors():
            loc = [str(p) for p in e.get("loc", []) if p not in ("body", "query", "path")]
            msg = e.get("msg", "Invalid value").removeprefix("Value error, ")
            details.append({"field": ".".join(_camel(p) for p in loc) or None, "message": msg})
        first = details[0]["message"] if details else "Invalid request"
        return _envelope(422, "validation_error", first, details)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        code = {401: "unauthorized", 403: "forbidden", 404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
        return _envelope(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        log.exception("Unhandled error", exc_info=exc)
        return _envelope(500, "internal_error", "Something went wrong on our side.")
