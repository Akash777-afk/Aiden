from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class ChatAction(CamelModel):
    label: str
    to: str


class MessageOut(CamelModel):
    id: str
    role: str
    text: str
    actions: list[ChatAction] = Field(default_factory=list)
    crisis: bool = False
    at: datetime = Field(validation_alias="created_at")


class ConversationIn(CamelModel):
    mode: str = Field("personal", pattern="^(personal|guided)$")


class ConversationSummary(CamelModel):
    id: str
    mode: str
    title: str
    updated_at: datetime
    message_count: int = 0


class ConversationOut(CamelModel):
    id: str
    mode: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut]


class SendIn(CamelModel):
    text: str = Field(min_length=1, max_length=1000)


class SendOut(CamelModel):
    user_message: MessageOut
    assistant_message: MessageOut


class HistoryItem(CamelModel):
    role: str = Field(pattern="^(user|ai)$")
    text: str = Field(max_length=1000)


class EphemeralIn(CamelModel):
    text: str = Field(min_length=1, max_length=1000)
    history: list[HistoryItem] = Field(default_factory=list, max_length=20)


class EphemeralOut(CamelModel):
    assistant_message: MessageOut


class MemoryIn(CamelModel):
    label: str = Field(min_length=2, max_length=120)


class MemoryPatch(CamelModel):
    enabled: bool


class MemoryOut(CamelModel):
    id: str
    label: str
    enabled: bool
    source: str
    created_at: datetime
