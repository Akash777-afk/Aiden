from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import text

from app.db.session import engine
from tests.conftest import API

TODAY = datetime.now(ZoneInfo("Asia/Kolkata")).date()


# ---------- Check-ins

def test_checkin_create_list_summary(client, user):
    h = user["h"]
    r = client.post(f"{API}/checkins", json={"emotion": "stressed", "intensity": 4, "note": "Deadline", "triggers": ["Work", "Work", " Sleep "]}, headers=h)
    assert r.status_code == 201
    c = r.json()
    assert c["triggers"] == ["Work", "Sleep"] and c["at"]
    client.post(f"{API}/checkins", json={"emotion": "calm"}, headers=h)
    page = client.get(f"{API}/checkins", headers=h).json()
    assert page["total"] == 2 and page["items"][0]["emotion"] == "calm"  # newest first
    s = client.get(f"{API}/checkins/summary?days=7", headers=h).json()
    assert s["count"] == 2 and s["streak"] == 1


def test_checkin_validation(client, user):
    r = client.post(f"{API}/checkins", json={"emotion": "elated", "intensity": 9}, headers=user["h"])
    assert r.status_code == 422
    assert {d["field"] for d in r.json()["error"]["details"]} == {"emotion", "intensity"}


# ---------- Journal

def test_journal_crud_search_tags(client, user):
    h = user["h"]
    r = client.post(f"{API}/journal", json={"body": "Grateful for a slow, quiet morning walk.", "tags": ["#Gratitude", "rest", "rest"], "mood": "calm"}, headers=h)
    assert r.status_code == 201
    e = r.json()
    assert e["tags"] == ["gratitude", "rest"] and e["title"]  # default title generated
    client.post(f"{API}/journal", json={"title": "Work", "body": "Review meeting nerves today."}, headers=h)
    assert client.get(f"{API}/journal?q=quiet", headers=h).json()["total"] == 1
    assert client.get(f"{API}/journal?tag=rest", headers=h).json()["total"] == 1
    assert client.get(f"{API}/journal/tags", headers=h).json() == ["gratitude", "rest"]
    p = client.patch(f"{API}/journal/{e['id']}", json={"title": "Morning"}, headers=h).json()
    assert p["title"] == "Morning" and p["body"].startswith("Grateful")
    assert client.delete(f"{API}/journal/{e['id']}", headers=h).status_code == 204
    assert client.get(f"{API}/journal/{e['id']}", headers=h).status_code == 404


def test_journal_body_is_encrypted_at_rest(client, user):
    secret = "my-very-private-thought-xyz"
    client.post(f"{API}/journal", json={"title": "Private", "body": f"Today I wrote {secret} down."}, headers=user["h"])
    with engine.connect() as c:
        raw = c.execute(text("SELECT title, body FROM journal_entries")).all()
    assert raw and all(secret not in (b or "") and "Private" != t for t, b in raw)
    assert all(b.startswith("gAAAA") for _, b in raw)  # Fernet tokens


def test_journal_body_min_length(client, user):
    r = client.post(f"{API}/journal", json={"body": "short"}, headers=user["h"])
    assert r.status_code == 422


# ---------- Habits & routine

def test_habit_lifecycle_and_streak(client, user):
    h = user["h"]
    r = client.post(f"{API}/habits", json={"name": "Walk", "category": "activity", "time": "07:30", "frequency": [0, 1, 2, 3, 4, 5, 6, 6], "reminder": True}, headers=h)
    assert r.status_code == 201
    habit = r.json()
    assert habit["frequency"] == [0, 1, 2, 3, 4, 5, 6] and habit["target"] == "Daily" and habit["status"] is None
    hid = habit["id"]
    for d in (TODAY - timedelta(days=2), TODAY - timedelta(days=1), TODAY):
        assert client.put(f"{API}/habits/{hid}/logs/{d}", json={"status": "done"}, headers=h).status_code == 200
    got = client.get(f"{API}/habits", headers=h).json()[0]
    assert got["status"] == "done" and got["streak"] == 3 and str(TODAY) in got["history"]
    # undo today: streak keeps yesterday's run
    got = client.delete(f"{API}/habits/{hid}/logs/{TODAY}", headers=h).json()
    assert got["status"] is None and got["streak"] == 2
    stats = client.get(f"{API}/habits/stats?days=3", headers=h).json()
    assert [s["pct"] for s in stats][:2] == [100, 100]
    assert client.patch(f"{API}/habits/{hid}", json={"time": "08:00"}, headers=h).json()["time"] == "08:00"


def test_habit_rejects_future_log_and_bad_time(client, user):
    h = user["h"]
    hid = client.post(f"{API}/habits", json={"name": "Read", "category": "reading", "time": "13:30", "frequency": [1]}, headers=h).json()["id"]
    assert client.put(f"{API}/habits/{hid}/logs/{TODAY + timedelta(days=1)}", json={"status": "done"}, headers=h).status_code == 422
    assert client.post(f"{API}/habits", json={"name": "Bad", "category": "reading", "time": "25:00", "frequency": [1]}, headers=h).status_code == 422
    assert client.post(f"{API}/habits", json={"name": "Bad", "category": "reading", "time": "10:00", "frequency": [9]}, headers=h).status_code == 422


def test_default_routine_and_replace(client, user):
    h = user["h"]
    assert len(client.get(f"{API}/routine", headers=h).json()) == 5
    out = client.put(f"{API}/routine", json=[{"time": "22:00", "label": "Read"}, {"time": "06:30", "label": "Stretch", "icon": "Sun"}], headers=h).json()
    assert [s["label"] for s in out] == ["Stretch", "Read"] and out[0]["position"] == 0


# ---------- Sleep

def test_sleep_cross_midnight_upsert_and_limits(client, user):
    h = user["h"]
    night = TODAY - timedelta(days=1)
    r = client.put(f"{API}/sleep/logs/{night}", json={"bedtime": "23:30", "wake": "07:00", "quality": 4, "note": "Slept well"}, headers=h)
    assert r.status_code == 200 and r.json()["hours"] == 7.5
    r = client.put(f"{API}/sleep/logs/{night}", json={"bedtime": "22:00", "wake": "06:00", "quality": 5}, headers=h)
    assert r.json()["hours"] == 8.0
    assert len(client.get(f"{API}/sleep/logs", headers=h).json()) == 1  # upserted, not duplicated
    assert client.put(f"{API}/sleep/logs/{TODAY + timedelta(days=1)}", json={"bedtime": "22:00", "wake": "06:00", "quality": 3}, headers=h).status_code == 422
    assert client.put(f"{API}/sleep/logs/{night}", json={"bedtime": "10:00", "wake": "09:00", "quality": 3}, headers=h).status_code == 422  # 23h


def test_sleep_favorites(client, user):
    h = user["h"]
    assert client.put(f"{API}/sleep/favorites", json=["t1", "t4", "t1"], headers=h).json() == ["t1", "t4"]
    assert client.get(f"{API}/sleep/favorites", headers=h).json() == ["t1", "t4"]
    assert client.put(f"{API}/sleep/favorites", json=["bogus"], headers=h).status_code == 422


# ---------- Ownership isolation

def test_users_cannot_touch_each_others_data(client, user, other):
    jid = client.post(f"{API}/journal", json={"body": "Only mine, nobody else's."}, headers=user["h"]).json()["id"]
    cid = client.post(f"{API}/checkins", json={"emotion": "sad"}, headers=user["h"]).json()["id"]
    hid = client.post(f"{API}/habits", json={"name": "Mine", "category": "growth", "time": "09:00", "frequency": [1]}, headers=user["h"]).json()["id"]
    for method, path in [("get", f"/journal/{jid}"), ("delete", f"/journal/{jid}"), ("delete", f"/checkins/{cid}"), ("delete", f"/habits/{hid}"), ("patch", f"/habits/{hid}")]:
        r = getattr(client, method)(f"{API}{path}", headers=other["h"], **({"json": {}} if method == "patch" else {}))
        assert r.status_code == 404, (method, path, r.status_code)
    assert client.get(f"{API}/journal", headers=other["h"]).json()["total"] == 0
    assert client.get(f"{API}/journal/{jid}", headers=user["h"]).status_code == 200
