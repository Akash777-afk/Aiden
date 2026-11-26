from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models import AIMessage
from app.services.ai import safety
from tests.conftest import API


def decision(**kw):
    d = {
        "title": "Should I move to Pune?",
        "thoughts": {"happening": "Job offer in Pune", "feeling": "Excited but torn"},
        "actions": [
            {"id": "a1", "label": "Discuss the issue", "rating": 4, "benefits": "Clarity", "risks": "Awkward talk"},
            {"id": "a2", "label": "Wait and reassess", "rating": 2, "short": "Relief now"},
        ],
        "chosenActionId": "a1",
        "reflection": "Growth matters to me.",
        "map": {"positions": {"a2": {"x": 10, "y": 20}}, "notes": [{"id": "n1", "label": "Ask a friend", "position": {"x": 0, "y": 0}}], "edges": [{"id": "e1", "source": "a2", "target": "n1"}]},
    }
    d.update(kw)
    return d


# ---------- TAC

def test_decision_roundtrip(client, user):
    h = user["h"]
    r = client.post(f"{API}/decisions", json=decision(), headers=h)
    assert r.status_code == 201, r.text
    d = r.json()
    assert d["thoughts"]["happening"] == "Job offer in Pune" and d["thoughts"]["worry"] == ""
    assert d["actions"][0]["benefits"] == "Clarity" and d["actions"][1]["short"] == "Relief now"
    assert d["map"]["notes"][0]["label"] == "Ask a friend"
    summary = client.get(f"{API}/decisions", headers=h).json()[0]
    assert summary["chosenLabel"] == "Discuss the issue" and summary["actionCount"] == 2


def test_decision_replace_prunes_map_for_removed_actions(client, user):
    h = user["h"]
    sid = client.post(f"{API}/decisions", json=decision(), headers=h).json()["id"]
    upd = decision(actions=[{"id": "a1", "label": "Discuss the issue", "benefits": "Clarity"}])
    d = client.put(f"{API}/decisions/{sid}", json=upd, headers=h).json()
    assert len(d["actions"]) == 1
    assert "a2" not in d["map"]["positions"] and d["map"]["edges"] == []


def test_decision_validation(client, user):
    h = user["h"]
    assert client.post(f"{API}/decisions", json=decision(chosenActionId="nope"), headers=h).status_code == 422
    assert client.post(f"{API}/decisions", json=decision(actions=[]), headers=h).status_code == 422
    bad = decision()
    bad["thoughts"] = {"happening": ""}
    assert client.post(f"{API}/decisions", json=bad, headers=h).status_code == 422


def test_decision_reflect_is_non_predictive(client, user):
    sid = client.post(f"{API}/decisions", json=decision(), headers=user["h"]).json()["id"]
    txt = client.post(f"{API}/decisions/{sid}/reflect", headers=user["h"]).json()["text"]
    assert "Discuss the issue" in txt and "not predictions" in txt


def test_decision_ownership(client, user, other):
    sid = client.post(f"{API}/decisions", json=decision(), headers=user["h"]).json()["id"]
    assert client.get(f"{API}/decisions/{sid}", headers=other["h"]).status_code == 404
    assert client.put(f"{API}/decisions/{sid}", json=decision(), headers=other["h"]).status_code == 404


# ---------- AI

def _conv(client, h, mode="personal"):
    return client.post(f"{API}/ai/conversations", json={"mode": mode}, headers=h).json()["id"]


def test_conversation_flow_and_title(client, user):
    h = user["h"]
    cid = _conv(client, h)
    r = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "I feel overwhelmed with everything"}, headers=h)
    assert r.status_code == 200
    out = r.json()
    assert out["userMessage"]["role"] == "user" and out["assistantMessage"]["role"] == "ai"
    assert "smaller together" in out["assistantMessage"]["text"]
    assert out["assistantMessage"]["actions"][0]["to"] == "/pause/breathe"
    conv = client.get(f"{API}/ai/conversations/{cid}", headers=h).json()
    assert conv["title"].startswith("I feel overwhelmed") and len(conv["messages"]) == 2
    assert client.get(f"{API}/ai/conversations", headers=h).json()[0]["messageCount"] == 2
    assert client.delete(f"{API}/ai/conversations/{cid}/messages", headers=h).status_code == 204
    assert client.get(f"{API}/ai/conversations/{cid}", headers=h).json()["messages"] == []


def test_crisis_message_returns_helplines(client, user):
    cid = _conv(client, user["h"])
    msg = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "honestly I want to end my life"}, headers=user["h"]).json()["assistantMessage"]
    assert msg["crisis"] is True and "14416" in msg["text"] and "112" in msg["text"]


def test_hinglish_crisis_detected():
    assert safety.check_input("main marna chahta hoon").crisis
    assert safety.check_input("I don't want to wake up anymore").crisis
    assert not safety.check_input("I'm so excited about my new job").crisis


def test_medical_questions_are_redirected(client, user):
    cid = _conv(client, user["h"])
    msg = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "what dosage of sertraline mg should I take"}, headers=user["h"]).json()["assistantMessage"]
    assert "can't give medical advice" in msg["text"] and msg["actions"][0]["to"] == "/connect"


def test_output_filter_blocks_unsafe_claims():
    for bad in ["As your therapist, I am a licensed therapist and…", "You have clinical depression.", "This will definitely work."]:
        text, flags = safety.check_output(bad)
        assert flags and text == safety.SAFE_FALLBACK


def test_general_mode_is_not_stored(client, user):
    with SessionLocal() as db:
        before = db.scalar(select(func.count()).select_from(AIMessage))
    r = client.post(f"{API}/ai/ephemeral", json={"text": "I had a stressful day", "history": []}, headers=user["h"])
    assert r.status_code == 200 and r.json()["assistantMessage"]["role"] == "ai"
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(AIMessage)) == before


def test_personal_memory_respects_consent(client, user):
    h = user["h"]
    m = client.post(f"{API}/ai/memories", json={"label": "Walking helps on stressful days"}, headers=h).json()
    cid = _conv(client, h)
    t = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "work stress today"}, headers=h).json()["assistantMessage"]["text"]
    assert "Walking helps" in t
    client.patch(f"{API}/users/me/preferences", json={"ai": {"personalMemory": False}}, headers=h)
    t = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "work stress again"}, headers=h).json()["assistantMessage"]["text"]
    assert "Walking helps" not in t
    consents = {c["type"]: c["granted"] for c in client.get(f"{API}/users/me/consents", headers=h).json()}
    assert consents["ai_memory"] is False
    client.patch(f"{API}/users/me/preferences", json={"ai": {"personalMemory": True}}, headers=h)
    client.patch(f"{API}/ai/memories/{m['id']}", json={"enabled": False}, headers=h)
    t = client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "stress"}, headers=h).json()["assistantMessage"]["text"]
    assert "Walking helps" not in t


def test_ai_conversation_ownership(client, user, other):
    cid = _conv(client, user["h"])
    assert client.post(f"{API}/ai/conversations/{cid}/messages", json={"text": "hi"}, headers=other["h"]).status_code == 404
    assert client.get(f"{API}/ai/conversations/{cid}", headers=other["h"]).status_code == 404
