"""Field-level encryption for sensitive mental-health content.

Uses Fernet (AES-128-CBC + HMAC-SHA256). MultiFernet allows key rotation:
the first key in DATA_ENCRYPTION_KEYS encrypts, all keys can decrypt.
"""

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken, MultiFernet

from app.core.config import settings


def _normalise(key: str) -> bytes:
    """Accept a proper Fernet key, or derive one from any passphrase (dev convenience)."""
    raw = key.strip().encode()
    try:
        if len(base64.urlsafe_b64decode(raw)) == 32:
            return raw
    except Exception:  # noqa: BLE001 - not base64, derive below
        pass
    return base64.urlsafe_b64encode(hashlib.sha256(raw).digest())


@lru_cache
def _fernet() -> MultiFernet:
    keys = [k for k in settings.DATA_ENCRYPTION_KEYS.split(",") if k.strip()]
    if not keys:
        raise RuntimeError("DATA_ENCRYPTION_KEYS is empty")
    return MultiFernet([Fernet(_normalise(k)) for k in keys])


def encrypt(value: str | None) -> str | None:
    if value is None:
        return None
    return _fernet().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt(token: str | None) -> str | None:
    if token is None:
        return None
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken as exc:  # wrong key or tampered data — never silently return ciphertext
        raise ValueError("Unable to decrypt field (invalid key or corrupted data)") from exc


def generate_key() -> str:
    return Fernet.generate_key().decode()
