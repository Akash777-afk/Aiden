from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import TacAction, TacConsequence, TacSession, TacThought, User
from app.models.tac import CONSEQUENCE_KINDS, THOUGHT_KEYS
from app.db.base import new_id
from app.schemas.tac import DecisionIn, DecisionMap, DecisionOut, DecisionSummary, ReflectionOut
from app.services.common import get_owned


def to_out(s: TacSession) -> DecisionOut:
    thoughts = {k: "" for k in THOUGHT_KEYS}
    thoughts.update({t.key: t.text for t in s.thoughts})
    actions = []
    for a in s.actions:
        c = {k: "" for k in CONSEQUENCE_KINDS}
        c.update({x.kind: x.text for x in a.consequences})
        actions.append({"id": a.id, "label": a.label, "rating": a.rating, **c})
    layout = s.map_layout or {}
    return DecisionOut(
        id=s.id, title=s.title, thoughts=thoughts, actions=actions, chosen_action_id=s.chosen_action_id,
        reflection=s.reflection or "", map=DecisionMap.model_validate(layout), created_at=s.created_at, updated_at=s.updated_at,
    )


def _apply(s: TacSession, data: DecisionIn) -> None:
    s.title = data.title
    s.chosen_action_id = data.chosen_action_id
    s.reflection = data.reflection
    # Drop map references to actions that no longer exist.
    action_ids = {a.id for a in data.actions}
    note_ids = {n.id for n in data.map.notes}

    def known(node: str) -> bool:
        base = node.split(":")[0]
        return node == "root" or node in note_ids or base in action_ids

    m = data.map
    s.map_layout = {
        "positions": {k: v.model_dump() for k, v in m.positions.items() if known(k)},
        "notes": [n.model_dump() for n in m.notes],
        "edges": [e.model_dump() for e in m.edges if known(e.source) and known(e.target)],
    }
    s.thoughts = [TacThought(key=k, text=v) for k, v in data.thoughts.model_dump().items() if v]
    s.actions = [
        TacAction(
            pk=new_id(), id=a.id, label=a.label, rating=a.rating, position=i,
            consequences=[TacConsequence(kind=k, text=getattr(a, k)) for k in CONSEQUENCE_KINDS if getattr(a, k)],
        )
        for i, a in enumerate(data.actions)
    ]


def create(db: Session, user: User, data: DecisionIn) -> DecisionOut:
    s = TacSession(user_id=user.id)
    _apply(s, data)
    db.add(s)
    db.commit()
    return to_out(s)


def replace(db: Session, user: User, sid: str, data: DecisionIn) -> DecisionOut:
    s = get_owned(db, TacSession, sid, user.id, "Decision")
    s.thoughts.clear()
    s.actions.clear()
    db.flush()  # delete old children before re-inserting (unique session_id+id)
    _apply(s, data)
    db.commit()
    db.refresh(s)
    return to_out(s)


def get(db: Session, user: User, sid: str) -> DecisionOut:
    return to_out(get_owned(db, TacSession, sid, user.id, "Decision"))


def delete(db: Session, user: User, sid: str) -> None:
    db.delete(get_owned(db, TacSession, sid, user.id, "Decision"))
    db.commit()


def list_(db: Session, user: User) -> list[DecisionSummary]:
    rows = db.scalars(select(TacSession).where(TacSession.user_id == user.id).order_by(TacSession.updated_at.desc())).all()
    out = []
    for s in rows:
        chosen = next((a for a in s.actions if a.id == s.chosen_action_id), None)
        out.append(DecisionSummary(id=s.id, title=s.title, action_count=len(s.actions), chosen_action_id=s.chosen_action_id, chosen_label=chosen.label if chosen else None, created_at=s.created_at, updated_at=s.updated_at))
    return out


def reflect(db: Session, user: User, sid: str) -> ReflectionOut:
    from app.services.ai import provider  # late import keeps the AI layer optional

    d = get(db, user, sid)
    return ReflectionOut(text=provider.get_provider().reflect_decision(d))
