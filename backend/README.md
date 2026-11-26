# AIDEN — Backend (Phase 2)

FastAPI service for **AIDEN — A better connection with yourself.**

| Phase | Scope | State |
|---|---|---|
| 1 | Frontend | ✅ Approved |
| 2 | FastAPI backend: auth, services, AI abstraction | ✅ This deliverable |
| 3 | MySQL 8 + Alembic migrations, subscriptions/payments models, ER diagram | ⏭ Next |
| 4 | Frontend ↔ API integration | ⏸ |
| 5 | Real LLM, calls, payments, email, push | ⏸ |

## Quick start

```bash
cd backend
py -m venv .venv                       # Windows  (python3 -m venv .venv elsewhere)
.venv\Scripts\activate                 # or: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env                 # then set JWT_SECRET and DATA_ENCRYPTION_KEYS
python -m app.db.seed --demo           # catalog + demo@aiden.app / AidenDemo2026
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Contract: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) · OpenAPI: [`docs/openapi.json`](docs/openapi.json)
- Tests: `pytest` (46 tests)

In development the app uses SQLite and creates its tables on startup. From Phase 3, MySQL schemas are managed only by Alembic.

## Architecture

```
app/
  core/        config (env-only settings), security (Argon2id, JWT), crypto (field encryption), errors, rate limiting
  db/          declarative base + UTC/encrypted column types, session, seed
  models/      SQLAlchemy 2.0 models (28 tables)
  schemas/     Pydantic v2 models, camelCase on the wire
  services/    business logic, one module per domain (routes stay thin)
    ai/        provider abstraction + safety layer
  api/v1/      routers: auth/users, wellbeing (pulse/journal/rhythm/sleep), features (clarity/ai/connect/insights/learn/notifications)
```

Routes do validation and auth only; all rules live in `services/`. Phase 4 can therefore swap each frontend mock service (`frontend/src/services/*`) for an HTTP client against the matching endpoint group.

## Security & privacy

| Concern | Implementation |
|---|---|
| Passwords | Argon2id, rehashed on login when parameters change. Login compares against a dummy hash for unknown emails, so response timing doesn't reveal which accounts exist. |
| Sessions | 15-min JWT access tokens. Refresh tokens are opaque, stored as SHA-256 hashes, and **rotated** on every use. Reusing an old one revokes all of the user's sessions. |
| Brute force | Sliding-window limits on login (per email + IP) and registration (per IP). This is in-process; move it to Redis when running multiple replicas. |
| Sensitive data at rest | Journal title and body, check-in notes, AI messages and memories, TAC content, sleep notes and appointment notes are **Fernet-encrypted per field**. Multiple keys are supported for rotation. |
| Tenant isolation | Every query is scoped to the current user. Another user's IDs return **404**, so IDs can't be probed. This is covered by tests. |
| Double-booking | Service-level check **plus** a unique `(professional_id, active_slot)` index. Cancelling nulls the slot so it can be rebooked. |
| Responses | `Cache-Control: no-store` on all API responses, `nosniff`, `X-Frame-Options: DENY`, and restricted CORS. |
| Production guard | The app refuses to start in production with the development secrets. |
| Data rights | `GET /users/me/export` returns the user's full decrypted data. `DELETE /users/me` hard-deletes the account and everything linked to it (cascades). |

## AI safety layer (`app/services/ai/safety.py`)

This runs on **every** message, whatever the provider:
- **Pre-check:** crisis language, including romanised Hindi/Hinglish phrases, returns an immediate response with **Tele-MANAS 14416** and **112**, sets `crisis: true`, and never calls the model. Harm-to-others and medication/diagnosis questions are redirected to professionals.
- **Post-check:** replies that claim to be a therapist, make a diagnosis or guarantee an outcome are replaced with a safe fallback. The check uses rules only and never logs message content.
- **Memory:** used only in Personal mode, only when the user has consented (`ai_memory`), and only for items marked `enabled`.
- **General mode** (`/ai/ephemeral`) never writes to the database.

`AI_PROVIDER=mock` gives deterministic demo replies, ported from the approved frontend. Phase 5 adds real providers through `register_provider()` without changing any callers.

## Known limitations (deliberate for Phase 2)

- Journal search decrypts the user's entries in memory. That's fine at per-user scale; a blind index or search service can replace it later.
- The rate limiter and provider cache are per-process.
- Reminders create in-app notification rows only. Push, email and scheduling arrive in Phase 5.
- The sleep content catalog is still the frontend's static list (IDs `t1`–`t9`).
