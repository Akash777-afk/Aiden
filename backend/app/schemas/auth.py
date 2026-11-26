import re
from datetime import date, datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import CamelModel

PHONE_IN = re.compile(r"^(\+91[\s-]?)?[6-9]\d{9}$")


def _password_rules(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("Password must include a letter and a number")
    return v


class RegisterIn(CamelModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(max_length=128)
    accept_terms: bool
    confirm_age16: bool

    _pw = field_validator("password")(_password_rules)

    @field_validator("accept_terms", "confirm_age16")
    @classmethod
    def _must_accept(cls, v: bool) -> bool:
        if not v:
            raise ValueError("This must be accepted to create an account")
        return v


class LoginIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshIn(CamelModel):
    refresh_token: str = Field(min_length=20, max_length=200)


class TokenPair(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(CamelModel):
    id: str
    email: str
    full_name: str
    name: str
    phone: str | None = None
    city: str | None = None
    dob: date | None = None
    pronouns: str | None = None
    avatar: dict | None = None
    photo_url: str | None = None
    joined_at: datetime


class AuthOut(TokenPair):
    user: UserOut


class ProfilePatch(CamelModel):
    full_name: str | None = Field(None, min_length=2, max_length=80)
    name: str | None = Field(None, min_length=1, max_length=24)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    city: str | None = Field(None, max_length=40)
    dob: date | None = None
    pronouns: str | None = Field(None, pattern="^(|she/her|he/him|they/them)$")
    avatar: dict | None = None
    photo_url: str | None = Field(None, max_length=500)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v in (None, ""):
            return v or None
        if not PHONE_IN.match(v):
            raise ValueError("Enter a valid Indian mobile number")
        return v

    @field_validator("dob")
    @classmethod
    def _age(cls, v: date | None) -> date | None:
        if v is None:
            return v
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 16:
            raise ValueError("You must be 16 or older")
        if age > 120:
            raise ValueError("Enter a valid date of birth")
        return v


class ConsentIn(CamelModel):
    granted: bool


class ConsentOut(CamelModel):
    type: str
    granted: bool
    version: str
    updated_at: datetime
