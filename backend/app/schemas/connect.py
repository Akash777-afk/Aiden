from datetime import date, datetime

from pydantic import Field

from app.schemas.base import HHMM, CamelModel


class CredentialOut(CamelModel):
    kind: str
    title: str
    number: str | None
    verified: bool


class ProfessionalOut(CamelModel):
    id: str
    slug: str
    name: str
    designation: str
    specializations: list[str]
    qualifications: list[str]
    registration: str | None
    experience: int
    languages: list[str]
    rating: float
    reviews_count: int
    fee: int
    modes: list[str]
    avatar: dict | None
    available: bool
    next_slot: str | None
    is_sample: bool


class ProfessionalDetail(ProfessionalOut):
    bio: str
    approach: list[str]
    credentials: list[CredentialOut]
    pricing: dict[str, int]


class ReviewOut(CamelModel):
    id: str
    name: str = Field(validation_alias="display_name")
    rating: int
    text: str | None
    created_at: datetime


class Slot(CamelModel):
    time: str
    available: bool


class AppointmentIn(CamelModel):
    professional_id: str
    type: str = Field(pattern="^(text|voice|video|scheduled)$")
    date: date
    time: HHMM
    note: str | None = Field(None, max_length=300)


class AppointmentOut(CamelModel):
    id: str
    ref: str
    professional_id: str
    pro_name: str
    avatar: dict | None
    type: str
    starts_at: datetime
    date: date
    time: str
    duration_min: int
    price: int
    status: str
    note: str | None
    created_at: datetime


class ReviewIn(CamelModel):
    rating: int = Field(ge=1, le=5)
    text: str | None = Field(None, max_length=500)
