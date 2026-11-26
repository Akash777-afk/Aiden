import os
import pathlib
import uuid

DB_FILE = pathlib.Path(__file__).parent / "_test_aiden.db"
if DB_FILE.exists():
    DB_FILE.unlink()
os.environ.update(
    ENVIRONMENT="test",
    DATABASE_URL=f"sqlite:///{DB_FILE.as_posix()}",
    JWT_SECRET="test-secret-test-secret-test-secret-123",
    DATA_ENCRYPTION_KEYS="test-encryption-key",
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.api.deps import login_limiter, register_limiter  # noqa: E402
from app.main import app  # noqa: E402

API = "/api/v1"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
    from app.db.session import engine

    engine.dispose()
    DB_FILE.unlink(missing_ok=True)


@pytest.fixture(autouse=True)
def _reset_limits():
    login_limiter.reset()
    register_limiter.reset()


def register(client, name="Test User", password="secret123"):
    email = f"u_{uuid.uuid4().hex[:10]}@example.com"
    r = client.post(f"{API}/auth/register", json={"fullName": name, "email": email, "password": password, "acceptTerms": True, "confirmAge16": True})
    assert r.status_code == 201, r.text
    body = r.json()
    return {"Authorization": f"Bearer {body['accessToken']}"}, body, email


@pytest.fixture
def user(client):
    headers, body, email = register(client)
    return {"h": headers, "body": body, "email": email}


@pytest.fixture
def other(client):
    headers, body, email = register(client, name="Other Person")
    return {"h": headers, "body": body, "email": email}
