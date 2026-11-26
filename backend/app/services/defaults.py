"""Defaults mirrored from the approved frontend (AppContext / DataContext)."""

DEFAULT_PREFERENCES = {
    "theme": "light",
    "language": "English",
    "reminderTime": "21:30",
    "weekStart": "Mon",
    "reduceMotion": False,
    "notifications": {"reminders": True, "checkins": True, "insights": True, "sessions": True, "content": False, "quietHours": True},
    "privacy": {"appLock": False, "hidePreviews": True, "analytics": False},
    "ai": {"personalMemory": True, "tone": "warm", "length": "balanced", "suggestions": True},
}

ALLOWED_PREF_VALUES = {
    "theme": {"light", "dark", "system"},
    "weekStart": {"Mon", "Sun"},
    "ai.tone": {"warm", "direct", "curious"},
    "ai.length": {"short", "balanced", "detailed"},
}

DEFAULT_ROUTINE = [
    {"time": "07:00", "label": "Wake up", "icon": "Sunrise"},
    {"time": "07:15", "label": "Hydration", "icon": "Droplets"},
    {"time": "07:30", "label": "Physical movement", "icon": "Footprints"},
    {"time": "21:30", "label": "Mind declutter", "icon": "NotebookPen"},
    {"time": "22:30", "label": "Wind down", "icon": "Moon"},
]

EMOTION_SCORE = {"calm": 4, "happy": 5, "okay": 3, "stressed": 2, "anxious": 2, "sad": 1, "frustrated": 1}
