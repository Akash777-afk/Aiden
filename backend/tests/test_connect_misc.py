from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models import JournalEntry, MoodCheckin, User
from tests.conftest import API

IST = ZoneInfo("Asia/Kolkata")


def _first_free(client, h, pid):
    today = datetime.now(IST).date()
    for i in range(1, 10):
        d = today + timedelta(days=i)
        slots = client.get(f"{API}/professionals/{pid}/slots?date={d}", headers=h).json()
        free = [s["time"] for s in slots if s["available"]]
        if free:
            return str(d), free[0]
    raise AssertionError("no free slot")


# ---------- Connect

def test_professional_list_filters_and_sort(client, user):
    h = user["h"]
    allp = client.get(f"{API}/professionals", headers=h).json()
    assert len(allp) == 6 and all(p["isSample"] for p in allp)
    assert allp[0]["rating"] >= allp[-1]["rating"]
    fee = client.get(f"{API}/professionals?sort=fee", headers=h).json()
    assert [p["fee"] for p in fee] == sorted(p["fee"] for p in fee)
    assert {p["name"] for p in client.get(f"{API}/professionals?language=Tamil", headers=h).json()} == {"Dr. Meera Iyer", "Kavya Menon"}
    assert all(p["fee"] <= 800 for p in client.get(f"{API}/professionals?maxFee=800", headers=h).json())
    assert all("video" in p["modes"] for p in client.get(f"{API}/professionals?mode=video", headers=h).json())


def test_professional_detail_pricing(client, user):
    d = client.get(f"{API}/professionals/meera-iyer", headers=user["h"]).json()
    assert d["pricing"] == {"text": 720, "voice": 1080, "video": 1200, "scheduled": 4320}
    assert d["registration"].startswith("RCI") and d["qualifications"]
    assert client.get(f"{API}/professionals/meera-iyer/reviews", headers=user["h"]).json()["total"] == 3


def test_booking_flow_double_booking_and_cancel(client, user, other):
    h = user["h"]
    pid = client.get(f"{API}/professionals/rohan-kapoor", headers=h).json()["id"]
    day, time = _first_free(client, h, pid)
    r = client.post(f"{API}/appointments", json={"professionalId": pid, "type": "video", "date": day, "time": time, "note": "Work stress"}, headers=h)
    assert r.status_code == 201, r.text
    a = r.json()
    assert a["price"] == 900 and a["status"] == "confirmed" and a["time"] == time and a["ref"].startswith("AID-")
    # slot now unavailable and a second booking conflicts
    assert not next(s for s in client.get(f"{API}/professionals/{pid}/slots?date={day}", headers=h).json() if s["time"] == time)["available"]
    r2 = client.post(f"{API}/appointments", json={"professionalId": pid, "type": "voice", "date": day, "time": time}, headers=other["h"])
    assert r2.status_code == 409 and r2.json()["error"]["code"] == "slot_unavailable"
    # other user can't see or cancel it
    assert client.post(f"{API}/appointments/{a['id']}/cancel", headers=other["h"]).status_code == 404
    # cancel frees the slot
    assert client.post(f"{API}/appointments/{a['id']}/cancel", headers=h).json()["status"] == "cancelled"
    assert client.post(f"{API}/appointments", json={"professionalId": pid, "type": "voice", "date": day, "time": time}, headers=other["h"]).status_code == 201
    # reviewing a future/cancelled session is refused
    assert client.post(f"{API}/appointments/{a['id']}/review", json={"rating": 5}, headers=h).status_code == 409
    # booking created a notification
    titles = [n["title"] for n in client.get(f"{API}/notifications", headers=h).json()["items"]]
    assert any("Session booked" in t for t in titles)


def test_booking_validation(client, user):
    h = user["h"]
    farhan = client.get(f"{API}/professionals/farhan-siddiqui", headers=h).json()["id"]
    day, time = _first_free(client, h, farhan)
    assert client.post(f"{API}/appointments", json={"professionalId": farhan, "type": "text", "date": day, "time": time}, headers=h).status_code == 422  # mode not offered
    assert client.post(f"{API}/appointments", json={"professionalId": farhan, "type": "video", "date": day, "time": "03:15"}, headers=h).status_code == 422  # not in schedule
    far = str(datetime.now(IST).date() + timedelta(days=60))
    assert client.post(f"{API}/appointments", json={"professionalId": farhan, "type": "video", "date": far, "time": "09:00"}, headers=h).status_code == 422


# ---------- Insights / learn / notifications / preferences

def test_insights_shape(client, user):
    h = user["h"]
    client.post(f"{API}/checkins", json={"emotion": "happy"}, headers=h)
    for days in (7, 30):
        r = client.get(f"{API}/insights?days={days}", headers=h).json()
        assert len(r["mood"]) == days and len(r["habits"]) == days and len(r["sleep"]) == days
        assert len(r["journal"]) == (7 if days == 7 else 4)
        assert r["stats"]["avgMood"] == 5 and r["stats"]["checkinStreak"] == 1
        assert set(r["growth"]) == {"chat", "habit", "sleep", "reflect", "grow"} and r["patterns"]


def test_learn_progress(client, user):
    h = user["h"]
    assert len(client.get(f"{API}/learn/categories", headers=h).json()) == 8
    arts = client.get(f"{API}/learn/articles?category=emotions", headers=h).json()
    assert {a["id"] for a in arts} == {"name-it-to-tame-it", "anxiety-alarm"}
    assert client.put(f"{API}/learn/articles/stress-curve/complete", headers=h).json()["completed"] is True
    assert client.put(f"{API}/learn/articles/stress-curve/bookmark", headers=h).json()["bookmarked"] is True
    d = client.delete(f"{API}/learn/articles/stress-curve/complete", headers=h).json()
    assert d["completed"] is False and d["bookmarked"] is True and d["sections"]
    assert client.put(f"{API}/learn/articles/nope/complete", headers=h).status_code == 404


def test_notifications(client, user):
    h = user["h"]
    n = client.get(f"{API}/notifications", headers=h).json()
    assert n["unread"] == 1 and n["items"][0]["title"].startswith("Welcome")
    assert client.post(f"{API}/notifications/{n['items'][0]['id']}/read", headers=h).json()["read"] is True
    assert client.get(f"{API}/notifications", headers=h).json()["unread"] == 0
    assert client.delete(f"{API}/notifications", headers=h).status_code == 204
    assert client.get(f"{API}/notifications", headers=h).json()["items"] == []


def test_preferences_merge_and_validation(client, user):
    h = user["h"]
    p = client.patch(f"{API}/users/me/preferences", json={"theme": "dark", "notifications": {"content": True}, "unknownKey": 1}, headers=h).json()
    assert p["theme"] == "dark" and p["notifications"]["content"] is True and p["notifications"]["reminders"] is True
    assert "unknownKey" not in p
    assert client.patch(f"{API}/users/me/preferences", json={"theme": "neon"}, headers=h).status_code == 422
    assert client.patch(f"{API}/users/me/preferences", json={"timezone": "Mars/Base"}, headers=h).status_code == 422
    assert client.patch(f"{API}/users/me/preferences", json={"timezone": "Europe/London"}, headers=h).json()["timezone"] == "Europe/London"


def test_profile_update_validation(client, user):
    h = user["h"]
    r = client.patch(f"{API}/users/me", json={"name": "Akki", "phone": "9876543210", "city": "Mysuru"}, headers=h)
    assert r.status_code == 200 and r.json()["name"] == "Akki" and r.json()["phone"] == "9876543210"
    assert client.patch(f"{API}/users/me", json={"phone": "12345"}, headers=h).status_code == 422
    assert client.patch(f"{API}/users/me", json={"dob": str(datetime.now().date() - timedelta(days=365 * 10))}, headers=h).status_code == 422


def test_export_and_delete_account(client):
    from tests.conftest import register

    h, body, email = register(client)
    h = h
    client.post(f"{API}/journal", json={"body": "Exported entry text here."}, headers=h)
    client.post(f"{API}/checkins", json={"emotion": "okay", "note": "fine"}, headers=h)
    exp = client.get(f"{API}/users/me/export", headers=h).json()
    assert exp["journal"][0]["body"] == "Exported entry text here." and exp["checkins"][0]["note"] == "fine"
    uid = body["user"]["id"]
    assert client.delete(f"{API}/users/me", headers=h).status_code == 204
    assert client.get(f"{API}/auth/me", headers=h).status_code == 401
    with SessionLocal() as db:
        assert db.get(User, uid) is None
        assert db.scalar(select(func.count()).select_from(JournalEntry).where(JournalEntry.user_id == uid)) == 0
        assert db.scalar(select(func.count()).select_from(MoodCheckin).where(MoodCheckin.user_id == uid)) == 0


def test_health(client):
    assert client.get(f"{API}/health").json() == {"status": "ok", "version": "0.2.0", "db": "ok"}
