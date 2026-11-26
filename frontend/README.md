# AIDEN — Frontend (Phase 1)

> **A better connection with yourself.**
> Mobile-first AI mental wellness web app / PWA. Phase 1 = frontend only, running on mock data.

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Frontend (React + Vite) with mock data | ✅ Ready for review |
| 2 | FastAPI backend | ⏸ Awaiting frontend approval |
| 3 | MySQL + Alembic | ⏸ |
| 4 | Frontend ↔ API integration | ⏸ |
| 5 | LLM, calls, payments, notifications | ⏸ |

**Nothing in this build is real:** the AI replies are labelled demo responses, the professionals are fictional samples, and the calls, bookings and payments are simulated. Sounds are generated in your browser.

## Tech

React 18 · Vite 8 · Tailwind CSS v4 · React Router 6 · Framer Motion · Lucide · Recharts · React Hook Form · React Flow (`@xyflow/react`) · Context API. Plain JavaScript (no TypeScript).

## Run locally

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build at http://localhost:4173
```

Requires Node 20+.

## Demo sign-in

The app opens on the welcome/onboarding screen. Click **Continue with demo account**, or sign up with any valid email and an 8+ character password containing a number. No account is created.

## Modules

| Route | Module |
|---|---|
| `/` | Home dashboard: emotional check-in, Aiden card, toolkit, progress |
| `/ai` | **AIDEN AI**: Personal, General and Guided modes, plus conversation history |
| `/connect` → `/connect/:id` → `/connect/:id/book` → `/connect/session/:id` | **Connect**: directory, profile, 3-step booking, simulated text/voice/video session |
| `/rhythm`, `/rhythm/routine` | **Rhythm**: habits with add/edit/delete/skip/reschedule/reminders, week and month views, editable routine |
| `/sleep` | **Sleep**: generated soundscapes, stories, timer, favourites, rituals, sleep journal, morning reflection |
| `/pause`, `/pause/breathe`, `/pause/grounding`, `/pause/relax/:kind`, `/pause/play/:game` | **Pause**: breathing, 5-4-3-2-1, guided practices, 4 games (Bubble Flow, Sandscape, Flow Lines, Color Balance), Calm Moments |
| `/clarity`, `/clarity/new`, `/clarity/:id` | **Clarity (TAC)**: Thoughts → Actions → Consequences wizard, an interactive decision map, compare and reflect |
| `/pulse` | Check-ins with intensity, triggers, a mood calendar and a summary |
| `/journal` | Entries with guided prompts, tags, search and date filters |
| `/insights` | Wellbeing analytics (week/month) |
| `/learn`, `/learn/:id` | Psychology learning library |
| `/profile`, `/settings`, `/notifications` | Account, preferences, privacy, AI personalisation, theme, help, about |

**Reviewer tip:** Settings → Prototype tools → *Simulate network errors* shows the error states on pages that load data. *Reset demo* restores the sample data.

## Project structure

```
src/
  components/
    common/        Design-system primitives (Button, Card, Input, Modal, ProgressRing, Toggle, EmotionSelector…)
    layout/        AppShell, Sidebar (desktop), BottomNav (mobile), SupportSheet, Splash
    illustrations/ Logo, AidenBot mascot, HeroScene, tile art (all inline SVG)
    dashboard/ ai/ connect/ rhythm/ sleep/ pause/ clarity/ insights/
  pages/           One folder per route group (lazy-loaded)
  context/         AppContext (user/prefs/theme), DataContext (demo data store), ToastContext
  services/        Mock API layer. In Phase 4 this is swapped for real HTTP clients; callers stay unchanged
  mock/            Seed data and content
  hooks/ utils/ routes/ styles/
```

## Data & privacy in Phase 1

- **Wellbeing data** (check-ins, journal, chats, decisions, bookings) lives **in memory only** and resets on reload.
- **Only non-sensitive preferences** go to `localStorage` under the `aiden.*` prefix: theme, UI settings, sleep favourites, completed lessons, the demo profile, and bookmarks.

## Environment variables

Copy `.env.example` to `.env`. No secrets are needed in Phase 1.

| Var | Purpose |
|---|---|
| `VITE_USE_MOCKS` | `true` in Phase 1 |
| `VITE_API_BASE_URL` | FastAPI base URL (Phase 2+) |
| `VITE_APP_NAME` | Display name |

## Deploy to Vercel

`vercel.json` already rewrites all app routes to `index.html`, so deep links like `/clarity/new` work.

**Option A: dashboard**
1. Push the repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo.
3. Set **Root Directory** to `frontend`. Framework is auto-detected as **Vite**; build command is `npm run build` and output is `dist`.
4. Add the env vars from `.env.example` (optional), then **Deploy**.

**Option B: CLI**
```bash
npm i -g vercel
cd frontend
vercel          # first run links the project (preview deploy)
vercel --prod   # production deploy
```

## PWA

`public/manifest.json`, app icons in `public/icons/`, theme colour and a service worker (`public/sw.js`, registered in production builds only) make the app installable. Use **Add to Home Screen** on Android/iOS or the install button in desktop Chrome/Edge. The service worker caches only the app shell and static assets, never user data.
