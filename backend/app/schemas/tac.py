from datetime import datetime

from pydantic import Field, model_validator

from app.schemas.base import CamelModel


class Thoughts(CamelModel):
    happening: str = Field(min_length=1, max_length=500)
    thinking: str = Field("", max_length=500)
    feeling: str = Field("", max_length=500)
    assumptions: str = Field("", max_length=500)
    worry: str = Field("", max_length=500)


class ActionIn(CamelModel):
    id: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=2, max_length=60)
    rating: int = Field(3, ge=1, le=5)
    benefits: str = Field("", max_length=300)
    risks: str = Field("", max_length=300)
    short: str = Field("", max_length=300)
    long: str = Field("", max_length=300)
    uncertainties: str = Field("", max_length=300)


class Point(CamelModel):
    x: float
    y: float


class MapNote(CamelModel):
    id: str = Field(max_length=64)
    label: str = Field(min_length=1, max_length=200)
    position: Point


class MapEdge(CamelModel):
    id: str = Field(max_length=64)
    source: str = Field(max_length=80)
    target: str = Field(max_length=80)


class DecisionMap(CamelModel):
    positions: dict[str, Point] = Field(default_factory=dict)
    notes: list[MapNote] = Field(default_factory=list, max_length=40)
    edges: list[MapEdge] = Field(default_factory=list, max_length=80)


class DecisionIn(CamelModel):
    title: str = Field(min_length=3, max_length=80)
    thoughts: Thoughts
    actions: list[ActionIn] = Field(min_length=1, max_length=6)
    chosen_action_id: str | None = None
    reflection: str = Field("", max_length=600)
    map: DecisionMap = Field(default_factory=DecisionMap)

    @model_validator(mode="after")
    def _check(self):
        ids = [a.id for a in self.actions]
        if len(ids) != len(set(ids)):
            raise ValueError("Action ids must be unique")
        labels = [a.label.lower() for a in self.actions]
        if len(labels) != len(set(labels)):
            raise ValueError("Each action needs a different name")
        if self.chosen_action_id and self.chosen_action_id not in ids:
            raise ValueError("chosenActionId must reference one of the actions")
        return self


class DecisionOut(DecisionIn):
    id: str
    created_at: datetime
    updated_at: datetime


class DecisionSummary(CamelModel):
    id: str
    title: str
    action_count: int
    chosen_action_id: str | None
    chosen_label: str | None
    created_at: datetime
    updated_at: datetime


class ReflectionOut(CamelModel):
    text: str
