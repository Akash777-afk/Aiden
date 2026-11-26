from tests.conftest import API, register


def test_register_returns_tokens_and_camelcase_user(client):
    _, body, email = register(client, name="Akash Ganapathy")
    assert set(body) >= {"accessToken", "refreshToken", "tokenType", "expiresIn", "user"}
    assert body["user"]["email"] == email
    assert body["user"]["fullName"] == "Akash Ganapathy"
    assert body["user"]["name"] == "Akash"  # preferred name defaults to first name
    assert "password_hash" not in str(body) and "passwordHash" not in str(body)


def test_register_validation_uses_error_envelope(client):
    r = client.post(f"{API}/auth/register", json={"fullName": "A B", "email": "bad", "password": "short", "acceptTerms": False, "confirmAge16": True})
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "validation_error"
    fields = {d["field"] for d in err["details"]}
    assert {"email", "password", "acceptTerms"} <= fields


def test_password_needs_letter_and_number(client):
    r = client.post(f"{API}/auth/register", json={"fullName": "A B", "email": "x1@example.com", "password": "abcdefghij", "acceptTerms": True, "confirmAge16": True})
    assert r.status_code == 422
    assert "letter and a number" in r.json()["error"]["message"]


def test_duplicate_email_conflict(client, user):
    r = client.post(f"{API}/auth/register", json={"fullName": "Dup", "email": user["email"].upper(), "password": "secret123", "acceptTerms": True, "confirmAge16": True})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "email_taken"


def test_login_and_me(client, user):
    r = client.post(f"{API}/auth/login", json={"email": user["email"], "password": "secret123"})
    assert r.status_code == 200
    me = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {r.json()['accessToken']}"})
    assert me.status_code == 200 and me.json()["email"] == user["email"]


def test_wrong_password_and_unknown_email_look_identical(client, user):
    a = client.post(f"{API}/auth/login", json={"email": user["email"], "password": "wrong-pass1"})
    b = client.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "wrong-pass1"})
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()


def test_protected_routes_require_token(client):
    r = client.get(f"{API}/journal")
    assert r.status_code == 401 and r.json()["error"]["code"] == "unauthorized"
    r = client.get(f"{API}/journal", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


def test_refresh_rotates_and_reuse_revokes_all_sessions(client, user):
    rt1 = user["body"]["refreshToken"]
    r = client.post(f"{API}/auth/refresh", json={"refreshToken": rt1})
    assert r.status_code == 200
    rt2 = r.json()["refreshToken"]
    assert rt2 != rt1
    # Reusing the old token = theft signal → 401 and the new token is revoked too
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": rt1}).status_code == 401
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": rt2}).status_code == 401


def test_logout_revokes_refresh_token(client, user):
    rt = user["body"]["refreshToken"]
    assert client.post(f"{API}/auth/logout", json={"refreshToken": rt}, headers=user["h"]).status_code == 204
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": rt}).status_code == 401


def test_login_rate_limited(client, user):
    codes = [client.post(f"{API}/auth/login", json={"email": user["email"], "password": "nope12345"}).status_code for _ in range(11)]
    assert codes[-1] == 429
    assert client.post(f"{API}/auth/login", json={"email": user["email"], "password": "secret123"}).json()["error"]["code"] == "rate_limited"


def test_security_headers_and_no_cache(client, user):
    r = client.get(f"{API}/auth/me", headers=user["h"])
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["cache-control"] == "no-store"
