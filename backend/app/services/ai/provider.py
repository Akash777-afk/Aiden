"""AI provider abstraction. The app talks only to `AIProvider`; concrete LLM providers
(configured via AI_PROVIDER + API keys in env) are added in Phase 5 without touching callers."""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from functools import lru_cache

from app.core.config import settings


@dataclass
class AIContext:
    mode: str  # personal | general | guided
    user_name: str
    memories: list[str] = field(default_factory=list)  # only user-approved, enabled items
    tone: str = "warm"
    length: str = "balanced"


@dataclass
class AIReply:
    text: str
    actions: list[dict] = field(default_factory=list)


class AIProvider(ABC):
    name = "base"

    @abstractmethod
    def generate(self, history: list[dict], context: AIContext) -> AIReply:
        """history: [{role: 'user'|'ai', text}], last item is the new user message."""

    @abstractmethod
    def reflect_decision(self, decision) -> str: ...


# ---------------------------------------------------------------- Mock (demo) provider

_RULES = [
    (r"(overwhelm|too much|can'?t cope|drowning)",
     "That sounds like a lot to hold at once. Let's make it smaller together.\n\nFirst, one slow breath — in for 4, out for 6.\n\nNow, if you had to list everything on your mind, what's the one thing that feels heaviest right now?",
     [{"label": "Try a 1-minute breathing reset", "to": "/pause/breathe"}]),
    (r"(understand.*emotion|what am i feeling|emotion)",
     "Let's explore it gently. Feelings often come in layers.\n\n• What happened just before you noticed this feeling?\n• Where do you feel it in your body — chest, stomach, shoulders?\n• If it had a name, would it be closer to worry, sadness, frustration or something else?",
     [{"label": "Log a check-in", "to": "/pulse"}]),
    (r"(organi[sz]e|thoughts|messy|scattered|plan)",
     "Let's sort things into three buckets:\n\n1. **Can act on today**\n2. **Can act on later**\n3. **Outside my control**\n\nTell me what's on your mind, one item at a time, and I'll help you place each one.",
     [{"label": "Open TAC Method", "to": "/clarity/new"}]),
    (r"(reflect|look back|journal)",
     "A short reflection can be really grounding. Try these:\n\n• What gave me energy today?\n• What drained it?\n• What's one thing I'd like to carry into tomorrow?",
     [{"label": "Write in Journal", "to": "/journal"}]),
    (r"(difficult conversation|confront|talk to (my|him|her|them)|argument)",
     "Preparing helps. Let's shape it together:\n\n1. **What outcome do you hope for?**\n2. **What's the one thing you most want them to understand?**\n3. Start with an 'I' statement — e.g. \"I've been feeling… when…\"\n\nWho is the conversation with, and what's it about?",
     []),
    (r"(perspective|stuck|another way|different view)",
     "Let's try stepping outside the situation for a moment.\n\nIf a close friend described this exact situation to you, what would you tell them? And how might you see this a year from now?",
     []),
    (r"(sleep|can'?t switch off|insomnia|night)",
     "Racing thoughts at night are really common. A couple of things that may help:\n\n• Write tomorrow's worries down with one next step each — then 'park' them.\n• Try a slow-exhale breath or a calm soundscape.\n\nWould you like me to open the Overthinking-at-night ritual?",
     [{"label": "Open Sleep rituals", "to": "/sleep"}]),
    (r"(stress|stressed|pressure|deadline|work)",
     "It sounds like today asked a lot of you.{memory}\n\nWhat part of today is still sitting with you the most?",
     []),
    (r"(sad|low|down|lonely|empty)",
     "I'm sorry you're feeling low. That's a heavy feeling, and it makes sense to want some support.\n\nWould it help to talk about what's been happening, or would you prefer something gentle to do right now?",
     [{"label": "Talk to a professional", "to": "/connect"}, {"label": "Calm Moments", "to": "/pause"}]),
    (r"(happy|good|great|grateful|win)",
     "That's lovely to hear! 🌱 What made it feel good? Noticing what helps is how we build more of it.",
     []),
]
_FALLBACKS = [
    "Thank you for sharing that. Can you tell me a little more about what's on your mind?",
    "I'm listening. What feels most important about this for you?",
    "That makes sense. How has this been affecting you day to day?",
]


class MockProvider(AIProvider):
    """Deterministic, rule-based demo responses (no model). Clearly labelled as demo in the UI."""

    name = "mock"

    def generate(self, history: list[dict], context: AIContext) -> AIReply:
        text = history[-1]["text"].lower()
        for pattern, reply, actions in _RULES:
            if re.search(pattern, text):
                memory = ""
                if context.mode == "personal" and context.memories:
                    relevant = next((m for m in context.memories if re.search(r"walk|stress|work", m, re.I)), None)
                    if relevant:
                        memory = f" You mentioned before: “{relevant}”."
                return AIReply(reply.replace("{memory}", memory), list(actions))
        turn = sum(1 for m in history if m["role"] == "user")
        return AIReply(_FALLBACKS[(turn - 1) % len(_FALLBACKS)])

    def reflect_decision(self, d) -> str:
        chosen = next((a for a in d.actions if a.id == d.chosen_action_id), None)
        if not chosen:
            return "Choose the option you’re leaning towards and I’ll reflect it back to you."
        parts = [f"You’re leaning towards “{chosen.label}”."]
        if chosen.benefits:
            parts.append(f"Its main upside, in your words: {chosen.benefits.strip()}")
        if chosen.risks:
            parts.append(f"A risk to plan for: {chosen.risks.strip()}")
        others = [a.label for a in d.actions if a.id != chosen.id]
        if others:
            parts.append("You also weighed " + ", ".join(f"“{o}”" for o in others) + ", which shows you considered alternatives carefully.")
        parts.append("Remember: these are possibilities, not predictions — you can revisit this decision as you learn more.")
        return " ".join(parts)


_REGISTRY: dict[str, type[AIProvider]] = {"mock": MockProvider}


def register_provider(name: str, cls: type[AIProvider]) -> None:
    _REGISTRY[name] = cls


@lru_cache
def get_provider() -> AIProvider:
    cls = _REGISTRY.get(settings.AI_PROVIDER)
    if cls is None:
        raise RuntimeError(f"Unknown AI_PROVIDER '{settings.AI_PROVIDER}'. Available: {sorted(_REGISTRY)}")
    return cls()
