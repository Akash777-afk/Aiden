# AIDEN API Contract — v1

Base URL: `/api/v1` · Format: JSON · Interactive docs at `/docs` (OpenAPI 3 at `/openapi.json`).

This contract is derived from the approved Phase 1 frontend. Each endpoint lists the screen it serves so the frontend's `src/services/*` mocks can be replaced one-for-one in Phase 4.

## Conventions

| Topic | Rule |
|---|---|
| Field naming | **camelCase** in requests and responses (matches the frontend). snake_case is also accepted on input. |
| IDs | UUID strings. |
| Timestamps | ISO-8601 UTC, e.g. `2026-11-26T09:30:00Z`. |
| Calendar dates | `YYYY-MM-DD` in the **user's local timezone** (habit logs, sleep nights). The user's timezone is stored in preferences (default `Asia/Kolkata`). |
| Auth | `Authorization: Bearer <accessToken>`. Access tokens last 15 min; refresh tokens last 14 days, are rotated on every refresh and stored hashed (revocable). |
| Pagination | `?limit=20&offset=0` → `{ "items": [...], "total": 42, "limit": 20, "offset": 0 }` |
| Errors | `{ "error": { "code": "validation_error", "message": "…", "details": [ { "field": "email", "message": "…" } ] } }` |
| Ownership | Every user-data endpoint is scoped to the authenticated user. Another user's resource returns **404** (never 403) so IDs can't be probed. |
| Sensitive data | Journal bodies, check-in notes, AI messages, AI memories, TAC content and sleep notes are **encrypted at rest** (field-level AES via Fernet). |

Error codes: `validation_error` (422), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `rate_limited` (429), `slot_unavailable` (409), `internal_error` (500).

---

## 1. Auth — *Welcome / Sign in / Create account*

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ fullName, email, password, acceptTerms: true, confirmAge16: true }` | `201 TokenPair + user` |
| POST | `/auth/login` | `{ email, password }` | `200 TokenPair + user` |
| POST | `/auth/refresh` | `{ refreshToken }` | `200 TokenPair` (old refresh token revoked) |
| POST | `/auth/logout` | `{ refreshToken }` | `204` |
| GET | `/auth/me` | — | `200 User` |

`TokenPair = { accessToken, refreshToken, tokenType: "bearer", expiresIn }`
Password rule: ≥ 8 chars, at least one letter and one number. Login is rate-limited (10 attempts / 5 min per email+IP).

## 2. Profile & preferences — *You / Settings*

| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` | `User { id, email, fullName, name, phone, city, dob, pronouns, avatar, photoUrl, joinedAt }` |
| PATCH | `/users/me` | Partial update. `phone`: Indian mobile; `dob`: age ≥ 16. |
| GET | `/users/me/preferences` | `{ theme, language, timezone, reminderTime, weekStart, reduceMotion, notifications{…}, privacy{…}, ai{ personalMemory, tone, length, suggestions } }` |
| PATCH | `/users/me/preferences` | Deep-merge partial update. |
| GET | `/users/me/consents` | List of `{ type, granted, version, updatedAt }` |
| PUT | `/users/me/consents/{type}` | `{ granted }` — types: `terms`, `privacy`, `ai_memory`, `analytics` |
| GET | `/users/me/export` | Full JSON export of the user's data (decrypted). |
| DELETE | `/users/me` | Permanently deletes the account and all data. `204` |

## 3. Pulse — emotional check-ins — *Home chips, Pulse*

| Method | Path | Notes |
|---|---|---|
| GET | `/checkins?from=&to=&limit=&offset=` | Newest first. |
| POST | `/checkins` | `{ emotion, intensity(1-5)=3, note?, triggers?[] }` → `201 Checkin` |
| DELETE | `/checkins/{id}` | `204` |
| GET | `/checkins/summary?days=7` | `{ count, streak, distribution:[{emotion,count}], topEmotion }` |

`emotion ∈ calm, happy, okay, stressed, anxious, sad, frustrated`

## 4. Journal — *Journal*

| Method | Path | Notes |
|---|---|---|
| GET | `/journal?q=&tag=&from=&to=&limit=&offset=` | Search runs over decrypted title+body server-side. |
| POST | `/journal` | `{ title?, body(10-5000), mood?, tags?[≤6] }` |
| GET / PATCH / DELETE | `/journal/{id}` | |
| GET | `/journal/tags` | `["work","sleep",…]` |

## 5. Rhythm — habits & routine — *Rhythm, Routine, Home "Today's rhythm"*

| Method | Path | Notes |
|---|---|---|
| GET | `/habits?date=YYYY-MM-DD` | Habits including `status` for the date, `streak`, and a `history` map for the last 35 days. |
| POST | `/habits` | `{ name(3-60), category, time "HH:MM", frequency:[0-6], reminder }` |
| PATCH / DELETE | `/habits/{id}` | |
| PUT | `/habits/{id}/logs/{date}` | `{ status: "done" \| "skipped" }` — upsert |
| DELETE | `/habits/{id}/logs/{date}` | Undo |
| GET | `/habits/stats?days=7` | `[{ date, done, total, pct }]` |
| GET | `/routine` | `[{ id, time, label, icon, position }]` |
| PUT | `/routine` | Replace the whole routine (array). |

`category ∈ wake, hydration, activity, sleep, mindfulness, journaling, reading, growth`

## 6. Sleep — *Sleep*

| Method | Path | Notes |
|---|---|---|
| GET | `/sleep/logs?days=30` | |
| PUT | `/sleep/logs/{date}` | `{ bedtime, wake, quality(1-5), note? }` → hours computed server-side (cross-midnight safe). |
| DELETE | `/sleep/logs/{date}` | |
| GET / PUT | `/sleep/favorites` | `["t1","t4"]` (content IDs) |

## 7. Clarity — TAC decisions — *Clarity, TAC wizard, Decision map*

| Method | Path | Notes |
|---|---|---|
| GET | `/decisions` | Summaries `{ id, title, actionCount, chosenActionId, chosenLabel, createdAt, updatedAt }` |
| POST | `/decisions` | Full `Decision` (below) |
| GET / PUT / DELETE | `/decisions/{id}` | PUT replaces the whole document (the wizard saves the full draft). |
| POST | `/decisions/{id}/reflect` | AI-assisted reflection `{ text }` (safety-filtered; never predictive). |

```json
Decision {
  "id": "…", "title": "Should I move to Pune?",
  "thoughts": { "happening": "…", "thinking": "…", "feeling": "…", "assumptions": "…", "worry": "…" },
  "actions": [ { "id": "…", "label": "Discuss the issue", "rating": 4,
                 "benefits": "…", "risks": "…", "short": "…", "long": "…", "uncertainties": "…" } ],
  "chosenActionId": "…", "reflection": "…",
  "map": { "positions": { "nodeId": {"x":0,"y":0} },
           "notes": [ { "id": "…", "label": "…", "position": {"x":0,"y":0} } ],
           "edges": [ { "id": "…", "source": "…", "target": "…" } ] }
}
```
Validation: title 3-80 chars, `thoughts.happening` required, 1–6 actions, and `chosenActionId` must reference an action.

## 8. AIDEN AI — *AI Companion*

| Method | Path | Notes |
|---|---|---|
| GET | `/ai/conversations` | Summaries, newest first. |
| POST | `/ai/conversations` | `{ mode: "personal" \| "guided" }` → empty conversation |
| GET | `/ai/conversations/{id}` | With messages. |
| DELETE | `/ai/conversations/{id}` | |
| POST | `/ai/conversations/{id}/messages` | `{ text(1-1000) }` → `{ userMessage, assistantMessage }` |
| DELETE | `/ai/conversations/{id}/messages` | Clear conversation. |
| POST | `/ai/ephemeral` | **General mode.** `{ text, history?[] }` → `{ assistantMessage }`. **Nothing is stored.** |
| GET | `/ai/memories` | User-approved context items. |
| POST | `/ai/memories` | `{ label }` |
| PATCH / DELETE | `/ai/memories/{id}` | `{ enabled }` |

`AssistantMessage = { id, role: "ai", text, actions:[{label,to}], crisis: bool, at }`
**Safety layer** (runs before and after the model): crisis detection returns helplines (Tele-MANAS 14416, 112) with `crisis: true`. Replies may not claim to be a therapist or give diagnoses. Personal memory is used only when `preferences.ai.personalMemory` is on **and** the item is `enabled`.

## 9. Connect — professionals & appointments — *Connect, Profile, Booking, Session*

| Method | Path | Notes |
|---|---|---|
| GET | `/professionals?q=&topic=&language=&mode=&maxFee=&available=&sort=rating\|fee\|experience` | |
| GET | `/professionals/{id}` | Includes credentials and review summary. |
| GET | `/professionals/{id}/reviews?limit=&offset=` | |
| GET | `/professionals/{id}/slots?date=YYYY-MM-DD` | `[{ time:"HH:MM", available }]` |
| GET | `/appointments` | The user's appointments. |
| POST | `/appointments` | `{ professionalId, type, date, time, note? }` → `201` (`409 slot_unavailable` if taken). Price is computed server-side. |
| GET | `/appointments/{id}` | |
| POST | `/appointments/{id}/cancel` | |
| POST | `/appointments/{id}/review` | `{ rating(1-5), text? }` — only after the appointment time. |

`type ∈ text, voice, video, scheduled` · Price multipliers: text 0.6, voice 0.9, video 1.0, scheduled 3.6 × base fee.

## 10. Insights — *Insights, Home "This week"*

| Method | Path | Notes |
|---|---|---|
| GET | `/insights?days=7\|30` | `{ stats:{avgMood, moodDeltaPct, habitPct, habitDeltaPct, avgSleep, journalEntries, checkinStreak}, mood:[{date,score,count}], habits:[{date,pct}], sleep:[{date,hours,quality}], journal:[{label,entries}], growth:{chat,habit,sleep,reflect,grow}, patterns:[string] }` |

## 11. Learn — *Learn, Article*

| Method | Path | Notes |
|---|---|---|
| GET | `/learn/categories` | |
| GET | `/learn/articles?category=&q=` | Includes `completed` and `bookmarked` for the user. |
| GET | `/learn/articles/{slug}` | |
| PUT / DELETE | `/learn/articles/{slug}/complete` | |
| PUT / DELETE | `/learn/articles/{slug}/bookmark` | |

## 12. Notifications — *Notifications, bell badge*

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | `{ items, unread }` |
| POST | `/notifications/{id}/read` | |
| POST | `/notifications/read-all` | |
| DELETE | `/notifications` | Clear all. |

## 13. System

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ status: "ok", version, db: "ok" }` (no auth) |
