"""Seed data.

* `seed_catalog` — reference content (sample professionals, learning library). Idempotent.
* `seed_demo_user` — demo account with realistic history, for Phase 4 demos.

Run:  python -m app.db.seed            (catalog)
      python -m app.db.seed --demo     (catalog + demo@aiden.app / AidenDemo2026)
"""

import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AIMemory, AvailabilityRule, Credential, Habit, HabitCompletion, JournalEntry, LearnArticle, LearnCategory, MoodCheckin,
    Professional, Review, SleepReflection, User,
)

# ---------------------------------------------------------------- Professionals (FICTIONAL SAMPLES)

PROS = [
    dict(slug="meera-iyer", name="Dr. Meera Iyer", designation="Clinical Psychologist", specializations=["Anxiety", "Stress", "Work-life balance"],
         quals=["M.Phil Clinical Psychology", "M.A. Psychology"], reg=("RCI Reg. No.", "SAMPLE-0000-A"), exp=9, langs=["English", "Hindi", "Tamil"],
         rating=4.9, reviews=214, fee=1200, modes=["text", "voice", "video", "scheduled"],
         avatar={"skin": "#C98E6B", "hair": "#2B1B17", "style": "long", "shirt": "#8B72C7", "bg": "#E9DFFB"},
         bio="Meera works with young professionals navigating anxiety, burnout and life transitions. Her approach blends CBT with mindfulness-based techniques, and she believes therapy should feel like a collaborative, judgement-free space.",
         approach=["Cognitive Behavioural Therapy", "Mindfulness-based", "Solution-focused"]),
    dict(slug="rohan-kapoor", name="Rohan Kapoor", designation="Counselling Psychologist", specializations=["Relationships", "Self-esteem", "Grief"],
         quals=["M.Sc Counselling Psychology"], reg=("RCI Reg. No.", "SAMPLE-0000-B"), exp=6, langs=["English", "Hindi", "Punjabi"],
         rating=4.8, reviews=156, fee=900, modes=["text", "voice", "video", "scheduled"],
         avatar={"skin": "#B07A57", "hair": "#1D1412", "style": "short", "shirt": "#5FA98D", "bg": "#D7F1E6"},
         bio="Rohan supports people through relationship challenges, low self-worth and loss. Warm and direct, he helps clients understand their patterns and build healthier ways of relating.",
         approach=["Person-centred", "Emotionally Focused", "Narrative therapy"]),
    dict(slug="ananya-rao", name="Ananya Rao", designation="Certified Wellness Coach", specializations=["Habits", "Motivation", "Sleep routines"],
         quals=["ICF Certified Coach (ACC)", "B.A. Psychology"], reg=("ICF Credential", "SAMPLE-ACC"), exp=5, langs=["English", "Kannada", "Telugu"],
         rating=4.7, reviews=98, fee=700, modes=["text", "video", "scheduled"],
         avatar={"skin": "#D9A27E", "hair": "#3A2418", "style": "bun", "shirt": "#F2A995", "bg": "#FDE6E1"},
         bio="Ananya helps people design routines that actually stick. Her coaching focuses on small, sustainable changes to sleep, energy and focus.",
         approach=["Behavioural coaching", "Habit design", "Goal setting"]),
    dict(slug="farhan-siddiqui", name="Dr. Farhan Siddiqui", designation="Psychiatrist", specializations=["Depression", "Anxiety", "Sleep disorders"],
         quals=["MBBS", "MD Psychiatry"], reg=("Medical Council Reg.", "SAMPLE-0000-C"), exp=12, langs=["English", "Hindi", "Urdu"],
         rating=4.9, reviews=302, fee=1800, modes=["video", "scheduled"],
         avatar={"skin": "#A86F4C", "hair": "#16100E", "style": "beard", "shirt": "#9CC3EE", "bg": "#E2EFFC"},
         bio="Farhan provides medical assessment and evidence-based treatment for mood, anxiety and sleep concerns, working alongside therapists for holistic care.",
         approach=["Medical assessment", "Integrated care", "Psychoeducation"], days=[5]),
    dict(slug="kavya-menon", name="Kavya Menon", designation="Counsellor", specializations=["Student stress", "Career anxiety", "Stress"],
         quals=["M.A. Applied Psychology", "PG Diploma Counselling"], reg=("RCI Reg. No.", "SAMPLE-0000-D"), exp=4, langs=["English", "Malayalam", "Tamil"],
         rating=4.6, reviews=72, fee=600, modes=["text", "voice", "scheduled"],
         avatar={"skin": "#C08562", "hair": "#24160F", "style": "curly", "shirt": "#F6CF7E", "bg": "#FFF2D6"},
         bio="Kavya specialises in supporting students and early-career professionals with exam stress, career decisions and the pressure to have it all figured out.",
         approach=["CBT", "Acceptance and Commitment Therapy"]),
    dict(slug="vikram-desai", name="Vikram Desai", designation="Mindfulness Coach", specializations=["Mindfulness", "Stress", "Focus"],
         quals=["MBSR Teacher Training", "M.Sc Psychology"], reg=("Coach Cert.", "SAMPLE-MBSR"), exp=8, langs=["English", "Marathi", "Hindi"],
         rating=4.8, reviews=121, fee=800, modes=["voice", "video", "scheduled"],
         avatar={"skin": "#B98261", "hair": "#5A5A5A", "style": "short", "shirt": "#C79AE6", "bg": "#ECE4FB"},
         bio="Vikram teaches practical mindfulness for busy minds — short practices that fit into a workday and help you respond rather than react.",
         approach=["MBSR", "Breathwork", "Compassion-focused"], days=[6]),
]
SAMPLE_REVIEWS = [("S.", 5, "Felt heard from the very first session. Practical and kind."), ("A.", 5, "Gave me tools I actually use every day."), ("R.", 4, "Very patient and thoughtful. Helped me untangle a lot.")]

# ---------------------------------------------------------------- Learn library

CATEGORIES = [
    ("ei", "Emotional intelligence", "Brain", "#8B72C7", "tint-lilac"), ("emotions", "Understanding emotions", "Heart", "#F2A995", "tint-peach"),
    ("stress", "Stress management", "Waves", "#8BCDB5", "tint-mint"), ("patterns", "Behavioural patterns", "Repeat", "#E9A86B", "tint-sun"),
    ("relationships", "Relationships", "Users", "#F19BB8", "tint-peach"), ("awareness", "Self-awareness", "Eye", "#9CC3EE", "tint-sky"),
    ("sleep", "Sleep education", "Moon", "#6E68C8", "tint-lilac"), ("mindfulness", "Mindfulness", "Flower2", "#6FBF8F", "tint-mint"),
]


def _s(h, *body):
    return {"h": h, "body": list(body)}


ARTICLES = [
    ("name-it-to-tame-it", "emotions", "Name it to tame it", "Why labelling a feeling precisely makes it easier to handle.", 4,
     [_s("The idea", "When we put feelings into words, we often feel a little less overwhelmed by them. Psychologists call this affect labelling.", "It does not make the feeling disappear — it gives you some distance from it, so you can choose what to do next."),
      _s("Go beyond \"bad\"", "\"Bad\" could mean disappointed, embarrassed, lonely or tired. The more precise the word, the clearer the need behind it."),
      _s("Try it", "Next time you check in, pick the closest emotion, then ask: what else is here? Often two feelings sit side by side.")],
     "A precise label turns a fog into something you can work with."),
    ("stress-curve", "stress", "The stress curve", "A little pressure sharpens you. Too much flattens you.", 5,
     [_s("Helpful stress", "Short bursts of stress can increase focus and energy — think of the alertness before a presentation."),
      _s("When it tips over", "When pressure stays high without recovery, performance and wellbeing drop. Signs include irritability, poor sleep and difficulty concentrating."),
      _s("Building recovery in", "Recovery is not a reward for finishing everything. Short breaks, movement and sleep keep you on the helpful side of the curve.")],
     "Notice where you are on the curve — and plan recovery before you need it."),
    ("emotional-granularity", "ei", "Emotional intelligence, simply", "Four skills: noticing, understanding, managing and relating.", 6,
     [_s("Four skills", "Emotional intelligence is commonly described as perceiving emotions, understanding them, managing them and using them to relate to others."),
      _s("It can grow", "Like any skill, it develops with practice: check-ins, reflection and honest conversations all help.")],
     "You build emotional intelligence one noticed moment at a time."),
    ("habit-loops", "patterns", "Cue, routine, reward", "How habits form — and how to gently rewire them.", 5,
     [_s("The loop", "Many habits follow a pattern: a cue triggers a routine, which delivers some kind of reward."),
      _s("Change the routine, keep the cue", "Instead of fighting the cue, swap in a routine that meets the same need. Scrolling to unwind? Try a two-minute stretch first.")],
     "Make the new routine easy, obvious and satisfying."),
    ("repair-conversations", "relationships", "Repair after conflict", "Small repairs matter more than avoiding every argument.", 4,
     [_s("Conflict is normal", "Healthy relationships still have disagreements. What matters is how people reconnect afterwards."),
      _s("Repair phrases", "\"I see your point.\" \"Can we start over?\" \"I got defensive — I'm sorry.\" Simple, sincere and timely.")],
     "Reach for repair early — it keeps small hurts from hardening."),
    ("values-compass", "awareness", "Your values compass", "Knowing what matters to you makes decisions lighter.", 5,
     [_s("Values vs goals", "Goals are things you complete. Values are directions you keep walking in — like kindness, curiosity or growth."),
      _s("Exercise", "Pick three values. For each, write one small action this week that moves you toward it.")],
     "When stuck, ask which option moves you toward your values."),
    ("sleep-pressure", "sleep", "Sleep pressure & your body clock", "Two systems decide when you feel sleepy.", 6,
     [_s("Two forces", "Sleep pressure builds the longer you are awake. Your circadian rhythm sets windows of alertness and sleepiness across the day."),
      _s("Work with them", "Consistent wake times, morning daylight and limiting late caffeine help both systems line up.")],
     "A consistent wake-up time is one of the most powerful sleep habits."),
    ("one-minute-mindfulness", "mindfulness", "One-minute mindfulness", "You do not need an hour. Start with sixty seconds.", 3,
     [_s("The practice", "Pause. Feel your feet. Notice three breaths. Notice one sound. Return to your day."),
      _s("Why it works", "Brief, frequent practice builds the habit of returning to the present — which is the core skill of mindfulness.")],
     "Frequency beats duration when you are starting out."),
    ("anxiety-alarm", "emotions", "Anxiety is an alarm, not a verdict", "Understanding the body’s protective response.", 5,
     [_s("A protective system", "Anxiety is the body preparing for a possible threat. It is useful, but sometimes it fires when no real danger is present."),
      _s("Turning the volume down", "Slow exhalations, grounding and naming the fear can signal safety to your nervous system.")],
     "The alarm is real; the danger may not be."),
]


def seed_catalog(db: Session) -> None:
    if db.scalar(select(Professional.id).limit(1)) is None:
        for p in PROS:
            pro = Professional(
                slug=p["slug"], name=p["name"], designation=p["designation"], bio=p["bio"], specializations=p["specializations"], approach=p["approach"],
                languages=p["langs"], experience_years=p["exp"], base_fee=p["fee"], modes=p["modes"], avatar=p["avatar"],
                rating_avg=p["rating"], reviews_count=p["reviews"], is_sample=True,
            )
            pro.credentials = [Credential(kind="qualification", title=q) for q in p["quals"]] + [Credential(kind="registration", title=p["reg"][0], number=p["reg"][1])]
            weekdays = p.get("days") or [1, 2, 3, 4, 5, 6]
            pro.availability = [AvailabilityRule(weekday=d, start_time=s, end_time=e, slot_minutes=90) for d in weekdays for s, e in (("09:00", "13:30"), ("14:00", "21:30"))]
            db.add(pro)
            db.flush()
            for i, (n, r, t) in enumerate(SAMPLE_REVIEWS):
                db.add(Review(professional_id=pro.id, display_name=f"{n} (sample)", rating=r, text=t, created_at=datetime.now(timezone.utc) - timedelta(days=14 + i * 10)))
    if db.scalar(select(LearnCategory.id).limit(1)) is None:
        for i, (cid, label, icon, color, tint) in enumerate(CATEGORIES):
            db.add(LearnCategory(id=cid, label=label, icon=icon, color=color, tint=tint, position=i))
        db.flush()
        for i, (slug, cat, title, summary, mins, sections, takeaway) in enumerate(ARTICLES):
            db.add(LearnArticle(slug=slug, category_id=cat, title=title, summary=summary, minutes=mins, sections=sections, takeaway=takeaway, position=i))
    db.commit()


DEMO_EMAIL = "demo@aiden.app"
DEMO_PASSWORD = "AidenDemo2026"


def seed_demo_user(db: Session) -> User:
    from app.schemas.auth import RegisterIn
    from app.services import auth_service

    existing = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if existing:
        return existing
    auth_service.register(db, RegisterIn(full_name="Akash Ganapathy", email=DEMO_EMAIL, password=DEMO_PASSWORD, accept_terms=True, confirm_age16=True))
    user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    user.profile.city = "Bengaluru"
    rnd = random.Random(7)
    now = datetime.now(timezone.utc)
    emotions = ["calm", "happy", "okay", "stressed", "anxious", "calm", "happy", "okay", "sad", "frustrated"]
    for d in range(1, 45):
        if rnd.random() < 0.18:
            continue
        db.add(MoodCheckin(user_id=user.id, emotion=rnd.choice(emotions), intensity=rnd.randint(1, 5), note=rnd.choice(["", "Deadline pressure at work.", "Evening walk helped a lot.", "Good sleep and a slow morning."]) or None, triggers=rnd.choice([["Work"], ["Sleep"], []]), created_at=now - timedelta(days=d, hours=rnd.randint(0, 10))))
    habits = [("Wake up without snoozing", "wake", "07:00"), ("Drink 2 glasses of water", "hydration", "07:15"), ("20-minute walk", "activity", "07:30"), ("Read 10 pages", "reading", "13:30"), ("5-minute breathing", "mindfulness", "18:00"), ("Mind declutter journal", "journaling", "21:30"), ("Screens off, wind down", "sleep", "22:30")]
    today = now.date()
    for i, (name, cat, t) in enumerate(habits):
        freq = [1, 2, 3, 4, 5] if cat == "reading" else list(range(7))
        h = Habit(user_id=user.id, name=name, category=cat, time=t, frequency=freq, reminder=i % 2 == 0, created_at=now - timedelta(days=40))
        db.add(h)
        db.flush()
        for d in range(1, 35):
            v = rnd.random()
            if v > 0.28:
                db.add(HabitCompletion(habit_id=h.id, date=today - timedelta(days=d), status="done"))
            elif v > 0.15:
                db.add(HabitCompletion(habit_id=h.id, date=today - timedelta(days=d), status="skipped"))
    for d in range(1, 22):
        hrs = round(5.6 + rnd.random() * 2.8, 1)
        db.add(SleepReflection(user_id=user.id, date=today - timedelta(days=d), bedtime="23:00", wake="07:00", hours=hrs, quality=max(1, min(5, round(hrs - 3 + rnd.random())))))
    for title, body, tags, mood, ago in [
        ("A quieter Sunday", "Spent the morning without my phone. It felt strange for the first hour, then surprisingly light.", ["gratitude", "rest"], "calm", 1),
        ("Before the review meeting", "I keep rehearsing worst-case scenarios. Writing them down makes them look smaller.", ["work", "anxiety"], "anxious", 3),
        ("Small win", "Finished the walk four days in a row. Noticing I sleep better on walk days.", ["habits", "win"], "happy", 6),
    ]:
        db.add(JournalEntry(user_id=user.id, title=title, body=body, tags=tags, mood=mood, created_at=now - timedelta(days=ago), updated_at=now - timedelta(days=ago)))
    for label in ["Prefers short, practical suggestions", "Walking helps on stressful days", "Working on a consistent bedtime"]:
        db.add(AIMemory(user_id=user.id, label=label))
    db.commit()
    return user


if __name__ == "__main__":
    import app.models  # noqa: F401
    from app.db.base import Base
    from app.db.session import SessionLocal, engine

    if engine.url.get_backend_name() == "sqlite":
        Base.metadata.create_all(engine)
    with SessionLocal() as s:
        seed_catalog(s)
        print("Catalog seeded.")
        if "--demo" in sys.argv:
            seed_demo_user(s)
            print(f"Demo user ready: {DEMO_EMAIL} / {DEMO_PASSWORD}")
