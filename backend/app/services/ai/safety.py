"""AI safety layer — runs on every user message (pre) and every model reply (post),
regardless of provider. Conservative by design: false positives are acceptable, misses are not.

This is a first line of defence, not a clinical risk assessment. Phase 5 adds a
classifier-based check and a human escalation path in addition to these rules.
"""

import re
from dataclasses import dataclass, field

HELPLINES = [
    {"name": "Tele-MANAS", "number": "14416", "note": "Free, 24×7 national mental health helpline (India)"},
    {"name": "Emergency", "number": "112", "note": "If you or someone else is in immediate danger"},
]

_CRISIS = [
    r"\bkill(ing)?\s+my\s*self\b", r"\bsuicid", r"\bend\s+(my|it\s+all|my\s+life)\b", r"\b(want|wanna|going)\s+to\s+die\b",
    r"\bself[\s-]?harm", r"\bhurt(ing)?\s+my\s*self\b", r"\bcut(ting)?\s+my\s*self\b", r"\bno\s+reason\s+to\s+live\b",
    r"\bbetter\s+off\s+(dead|without\s+me)\b", r"\bdon'?t\s+want\s+to\s+(live|be\s+alive|wake\s+up)\b", r"\boverdose\b",
    # Hinglish / Hindi (romanised)
    r"\bmarna\s+chaht", r"\bjeena\s+nahi\b", r"\bkhudkushi\b", r"\baatmahatya\b", r"\bkhud\s+ko\s+(khatam|nuksan)\b",
]
_HARM_OTHERS = [r"\bkill\s+(him|her|them|someone)\b", r"\bhurt\s+(him|her|them|someone)\b"]
_MEDICAL = [r"\b(dose|dosage|mg|milligram)s?\b", r"\b(should\s+i\s+(stop|start|take))\b.*\b(medication|meds|pills|tablets)\b", r"\bdiagnos(e|is)\s+me\b"]

_BANNED_OUTPUT = [
    (re.compile(r"\bI\s*(am|'m)\s+(a|your)\s+(licensed\s+)?(therapist|psychologist|psychiatrist|doctor|counsellor|counselor)\b", re.I), "therapist_claim"),
    (re.compile(r"\byou\s+(have|are\s+suffering\s+from)\s+(clinical\s+)?(depression|bipolar|ptsd|ocd|adhd|schizophrenia|an?\s+anxiety\s+disorder)\b", re.I), "diagnosis"),
    (re.compile(r"\b(will\s+definitely|guaranteed\s+to)\b", re.I), "guarantee"),
]


@dataclass
class SafetyResult:
    crisis: bool = False
    harm_to_others: bool = False
    medical: bool = False
    flags: list[str] = field(default_factory=list)


def check_input(text: str) -> SafetyResult:
    t = text.lower()
    r = SafetyResult()
    if any(re.search(p, t) for p in _CRISIS):
        r.crisis = True
        r.flags.append("crisis")
    if any(re.search(p, t) for p in _HARM_OTHERS):
        r.harm_to_others = True
        r.flags.append("harm_to_others")
    if any(re.search(p, t) for p in _MEDICAL):
        r.medical = True
        r.flags.append("medical")
    return r


CRISIS_REPLY = (
    "I'm really glad you told me, and I'm taking what you said seriously. You deserve support from a real person right now.\n\n"
    "• **Tele-MANAS: 14416** — free, 24×7 (India)\n"
    "• **Emergency: 112** — if you're in immediate danger\n\n"
    "If you can, reach out to someone you trust and let them know how you're feeling. I'm here with you while you do."
)

HARM_OTHERS_REPLY = (
    "It sounds like you're carrying a lot of intense feelings right now. If anyone is in immediate danger, please call **112**. "
    "Talking to a professional can really help with feelings this strong — would you like me to show you support options?"
)

MEDICAL_REPLY = (
    "That's an important question, and it's one a doctor or psychiatrist should answer — I can't give medical advice about "
    "medication or diagnoses. I can help you prepare questions for that conversation, or connect you with a professional."
)

SAFE_FALLBACK = "I want to make sure I support you well. Could you tell me a bit more about what's on your mind?"


def check_output(reply: str) -> tuple[str, list[str]]:
    """Return a safe reply plus any flags raised. Unsafe replies are replaced, never patched."""
    flags = [name for rx, name in _BANNED_OUTPUT if rx.search(reply)]
    if flags:
        return SAFE_FALLBACK, flags
    return reply, []
