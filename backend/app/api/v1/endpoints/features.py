from datetime import date

from fastapi import APIRouter, Query, Response

from app.api.deps import DB, CurrentUser
from app.schemas.ai import (
    ConversationIn, ConversationOut, ConversationSummary, EphemeralIn, EphemeralOut, MemoryIn, MemoryOut, MemoryPatch, SendIn, SendOut,
)
from app.schemas.base import Page
from app.schemas.connect import AppointmentIn, AppointmentOut, ProfessionalDetail, ProfessionalOut, ReviewIn, ReviewOut, Slot
from app.schemas.misc import ArticleDetail, ArticleOut, CategoryOut, InsightsOut, NotificationList, NotificationOut
from app.schemas.tac import DecisionIn, DecisionOut, DecisionSummary, ReflectionOut
from app.services import ai_service, connect_service, content_service, insights_service, tac_service

router = APIRouter()

# ---------- Clarity (TAC)


@router.get("/decisions", response_model=list[DecisionSummary], tags=["clarity"])
def list_decisions(db: DB, user: CurrentUser):
    return tac_service.list_(db, user)


@router.post("/decisions", response_model=DecisionOut, status_code=201, tags=["clarity"])
def create_decision(data: DecisionIn, db: DB, user: CurrentUser):
    return tac_service.create(db, user, data)


@router.get("/decisions/{sid}", response_model=DecisionOut, tags=["clarity"])
def get_decision(sid: str, db: DB, user: CurrentUser):
    return tac_service.get(db, user, sid)


@router.put("/decisions/{sid}", response_model=DecisionOut, tags=["clarity"])
def put_decision(sid: str, data: DecisionIn, db: DB, user: CurrentUser):
    return tac_service.replace(db, user, sid, data)


@router.delete("/decisions/{sid}", status_code=204, tags=["clarity"])
def delete_decision(sid: str, db: DB, user: CurrentUser):
    tac_service.delete(db, user, sid)
    return Response(status_code=204)


@router.post("/decisions/{sid}/reflect", response_model=ReflectionOut, tags=["clarity"])
def reflect(sid: str, db: DB, user: CurrentUser):
    return tac_service.reflect(db, user, sid)


# ---------- AI companion


@router.get("/ai/conversations", response_model=list[ConversationSummary], tags=["ai"])
def conversations(db: DB, user: CurrentUser):
    return ai_service.list_conversations(db, user)


@router.post("/ai/conversations", response_model=ConversationOut, status_code=201, tags=["ai"])
def new_conversation(data: ConversationIn, db: DB, user: CurrentUser):
    return ai_service.create_conversation(db, user, data.mode)


@router.get("/ai/conversations/{cid}", response_model=ConversationOut, tags=["ai"])
def get_conversation(cid: str, db: DB, user: CurrentUser):
    return ai_service.get_conversation(db, user, cid)


@router.delete("/ai/conversations/{cid}", status_code=204, tags=["ai"])
def delete_conversation(cid: str, db: DB, user: CurrentUser):
    ai_service.delete_conversation(db, user, cid)
    return Response(status_code=204)


@router.post("/ai/conversations/{cid}/messages", response_model=SendOut, tags=["ai"])
def send(cid: str, data: SendIn, db: DB, user: CurrentUser):
    return ai_service.send(db, user, cid, data.text)


@router.delete("/ai/conversations/{cid}/messages", status_code=204, tags=["ai"])
def clear(cid: str, db: DB, user: CurrentUser):
    ai_service.clear_conversation(db, user, cid)
    return Response(status_code=204)


@router.post("/ai/ephemeral", response_model=EphemeralOut, tags=["ai"])
def ephemeral(data: EphemeralIn, db: DB, user: CurrentUser):
    return EphemeralOut(assistant_message=ai_service.ephemeral(db, user, data.text, [h.model_dump() for h in data.history]))


@router.get("/ai/memories", response_model=list[MemoryOut], tags=["ai"])
def memories(db: DB, user: CurrentUser):
    return ai_service.list_memories(db, user)


@router.post("/ai/memories", response_model=MemoryOut, status_code=201, tags=["ai"])
def add_memory(data: MemoryIn, db: DB, user: CurrentUser):
    return ai_service.add_memory(db, user, data.label)


@router.patch("/ai/memories/{mid}", response_model=MemoryOut, tags=["ai"])
def patch_memory(mid: str, data: MemoryPatch, db: DB, user: CurrentUser):
    return ai_service.set_memory(db, user, mid, data.enabled)


@router.delete("/ai/memories/{mid}", status_code=204, tags=["ai"])
def delete_memory(mid: str, db: DB, user: CurrentUser):
    ai_service.delete_memory(db, user, mid)
    return Response(status_code=204)


@router.delete("/ai/memories", status_code=204, tags=["ai"])
def clear_memories(db: DB, user: CurrentUser):
    ai_service.clear_memories(db, user)
    return Response(status_code=204)


# ---------- Connect


@router.get("/professionals", response_model=list[ProfessionalOut], tags=["connect"])
def professionals(
    db: DB, user: CurrentUser, q: str | None = Query(None, max_length=80), topic: str | None = None, language: str | None = None,
    mode: str | None = Query(None, pattern="^(text|voice|video|scheduled)$"), max_fee: int | None = Query(None, alias="maxFee", ge=0),
    available: bool = False, sort: str = Query("rating", pattern="^(rating|fee|experience)$"),
):
    return connect_service.list_pros(db, q, topic, language, mode, max_fee, available, sort)


@router.get("/professionals/{pid}", response_model=ProfessionalDetail, tags=["connect"])
def professional(pid: str, db: DB, user: CurrentUser):
    return connect_service.detail(db, pid)


@router.get("/professionals/{pid}/reviews", response_model=Page[ReviewOut], tags=["connect"])
def pro_reviews(pid: str, db: DB, user: CurrentUser, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    return connect_service.reviews(db, pid, limit, offset)


@router.get("/professionals/{pid}/slots", response_model=list[Slot], tags=["connect"])
def pro_slots(pid: str, db: DB, user: CurrentUser, on: date = Query(alias="date")):
    return connect_service.slots(db, connect_service.get_pro(db, pid), on)


@router.get("/appointments", response_model=list[AppointmentOut], tags=["connect"])
def appointments(db: DB, user: CurrentUser):
    return connect_service.list_appts(db, user)


@router.post("/appointments", response_model=AppointmentOut, status_code=201, tags=["connect"])
def book(data: AppointmentIn, db: DB, user: CurrentUser):
    return connect_service.book(db, user, data)


@router.get("/appointments/{aid}", response_model=AppointmentOut, tags=["connect"])
def appointment(aid: str, db: DB, user: CurrentUser):
    return connect_service.get_appt(db, user, aid)


@router.post("/appointments/{aid}/cancel", response_model=AppointmentOut, tags=["connect"])
def cancel(aid: str, db: DB, user: CurrentUser):
    return connect_service.cancel(db, user, aid)


@router.post("/appointments/{aid}/review", response_model=ReviewOut, status_code=201, tags=["connect"])
def review(aid: str, data: ReviewIn, db: DB, user: CurrentUser):
    return connect_service.review(db, user, aid, data)


# ---------- Insights


@router.get("/insights", response_model=InsightsOut, tags=["insights"])
def insights(db: DB, user: CurrentUser, days: int = Query(7, ge=7, le=30)):
    return insights_service.compute(db, user, 30 if days > 7 else 7)


# ---------- Learn


@router.get("/learn/categories", response_model=list[CategoryOut], tags=["learn"])
def learn_categories(db: DB, user: CurrentUser):
    return content_service.categories(db)


@router.get("/learn/articles", response_model=list[ArticleOut], tags=["learn"])
def learn_articles(db: DB, user: CurrentUser, category: str | None = None, q: str | None = Query(None, max_length=80)):
    return content_service.articles(db, user, category, q)


@router.get("/learn/articles/{slug}", response_model=ArticleDetail, tags=["learn"])
def learn_article(slug: str, db: DB, user: CurrentUser):
    return content_service.article(db, user, slug)


@router.put("/learn/articles/{slug}/complete", response_model=ArticleDetail, tags=["learn"])
def complete(slug: str, db: DB, user: CurrentUser):
    return content_service.set_complete(db, user, slug, True)


@router.delete("/learn/articles/{slug}/complete", response_model=ArticleDetail, tags=["learn"])
def uncomplete(slug: str, db: DB, user: CurrentUser):
    return content_service.set_complete(db, user, slug, False)


@router.put("/learn/articles/{slug}/bookmark", response_model=ArticleDetail, tags=["learn"])
def bookmark(slug: str, db: DB, user: CurrentUser):
    return content_service.set_bookmark(db, user, slug, True)


@router.delete("/learn/articles/{slug}/bookmark", response_model=ArticleDetail, tags=["learn"])
def unbookmark(slug: str, db: DB, user: CurrentUser):
    return content_service.set_bookmark(db, user, slug, False)


# ---------- Notifications


@router.get("/notifications", response_model=NotificationList, tags=["notifications"])
def notifications(db: DB, user: CurrentUser):
    return content_service.notifications(db, user)


@router.post("/notifications/read-all", status_code=204, tags=["notifications"])
def read_all(db: DB, user: CurrentUser):
    content_service.mark_all_read(db, user)
    return Response(status_code=204)


@router.post("/notifications/{nid}/read", response_model=NotificationOut, tags=["notifications"])
def read_one(nid: str, db: DB, user: CurrentUser):
    return content_service.mark_read(db, user, nid)


@router.delete("/notifications", status_code=204, tags=["notifications"])
def clear_notifications(db: DB, user: CurrentUser):
    content_service.clear_notifications(db, user)
    return Response(status_code=204)
