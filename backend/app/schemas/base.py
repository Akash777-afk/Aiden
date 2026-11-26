import re
from datetime import date, datetime
from typing import Annotated, Generic, TypeVar

from pydantic import AfterValidator, BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """camelCase on the wire (matches the frontend), snake_case in Python; both accepted on input."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True, str_strip_whitespace=True)


class Page(CamelModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


_HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _hhmm(v: str) -> str:
    if not _HHMM.match(v):
        raise ValueError("Time must be HH:MM (24h)")
    return v


HHMM = Annotated[str, AfterValidator(_hhmm)]
Emotion = Annotated[str, Field(pattern="^(calm|happy|okay|stressed|anxious|sad|frustrated)$")]
LocalDate = date
UTC = datetime
