# GymRPG — Rise Through Strength

> A Solo Leveling–inspired fitness tracker where every rep counts as a battle move.

Log workouts → gain XP → level up 6 muscle disciplines → battle procedurally-generated monsters → climb the league ladder.

---

## Features

- **6 Disciplines** — Power, Titan, Precision, Endurance, Vitality, Synthesis — each levels 1→50 independently
- **Monster Battle Engine** — auto-resolves from your logged stats vs procedurally-generated monsters scaled to global user averages
- **League System** — Iron / Awakening / Bronze / Silver / Gold / Mythic with hard promotion gates
- **Body Composition Tracking** — LBM multiplier affects combat power; BF% gates block league advancement
- **Monthly Tournaments** — Boss monsters, ranking points, Slayer badges
- **Live Leaderboard** — WebSocket updates every 60 seconds
- **Daily Quests** — 3 generated per day, bonus XP on completion
- **50+ Achievements** — Milestone badges on your hunter profile
- **Dark Fantasy UI** — Deep blacks, glowing purples and golds, no light mode

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (dark fantasy theme) |
| State | Zustand |
| Charts | Recharts |
| Backend | Node.js + Express 4 + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access 7d + refresh 30d) |
| Real-time | WebSocket (ws) |
| Scheduling | node-cron |
| Deployment | Railway / Render |

---

## Monorepo Structure

```
gymrpg/
├── client/          # React Vite app
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── lib/
├── server/          # Express API
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       ├── websocket/
│       └── cron/
├── prisma/          # Schema + migrations + seed
│   ├── schema.prisma
│   └── seed.ts
├── shared/          # Types shared between client and server
│   └── types/
├── .env.example
├── package.json     # Workspace root
└── railway.toml
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 (or a free Railway/Supabase DB)
- npm ≥ 9 (workspaces)

### 1. Clone and install

```bash
git clone https://github.com/asminkacutie-afk/solo-gym-leveling.git
cd solo-gym-leveling
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Environment variables

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET at minimum
```

### 3. Database setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed: 150+ exercises, 20 monsters, 50+ achievements, demo user
npx prisma db seed
```

### 4. Run dev servers

```bash
# Both client (port 5173) and server (port 3001) concurrently
npm run dev
```

Or individually:

```bash
# Backend only
cd server && npm run dev

# Frontend only
cd client && npm run dev
```

### 5. Demo account

After seeding:
- Email: `demo@gymrpg.com`
- Password: `Demo1234!`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `PORT` | — | Server port (default: 3001) |
| `CLIENT_URL` | — | Frontend URL for CORS (default: http://localhost:5173) |
| `NODE_ENV` | — | `development` or `production` |
| `SMTP_HOST` | — | SMTP server for email verification |
| `SMTP_PORT` | — | SMTP port (default: 587) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (optional) |

---

## API Overview

All endpoints are prefixed `/api`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, receive tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user |

### Workouts
| Method | Path | Description |
|---|---|---|
| POST | `/workouts/sessions` | Start session |
| PUT | `/workouts/sessions/:id/end` | End session + trigger XP calc |
| POST | `/workouts/sessions/:id/sets` | Log a set (auto PR detect) |
| GET | `/workouts/sessions` | Paginated history |

### Profile
| Method | Path | Description |
|---|---|---|
| GET | `/profile/me` | Full profile |
| GET | `/profile/:username` | Public profile |
| GET | `/profile/me/records` | All PRs with rank |
| GET | `/profile/me/volume-history` | 12-week chart data |

### Leaderboard
| Method | Path | Description |
|---|---|---|
| GET | `/leaderboard/global` | All users ranked |
| GET | `/leaderboard/league/:league` | Per-league ranking |
| GET | `/leaderboard/monsters` | Monster board |
| GET | `/leaderboard/tournament-history` | Last 6 months |

### Body Composition
| Method | Path | Description |
|---|---|---|
| POST | `/body-composition` | Log weight + body fat % |
| GET | `/body-composition` | History |
| GET | `/body-composition/gates` | League gate check |
| POST | `/body-composition/navy-calculator` | Navy BF% estimator |

### Monsters & Tournaments
| Method | Path | Description |
|---|---|---|
| GET | `/monsters` | Active monsters for your league |
| POST | `/monsters/battle/:id` | Trigger battle |
| GET | `/tournaments/current` | Current month status |
| GET | `/tournaments/history` | Past 6 months |

### WebSocket

Connect to `ws://localhost:3001/ws`.

```json
// Subscribe to live leaderboard
{ "type": "subscribe", "channel": "leaderboard" }

// Identify your session
{ "type": "identify", "userId": "cuid..." }
```

---

## Deployment

### Railway (recommended)

1. Connect your GitHub repo to Railway
2. Add a PostgreSQL service
3. Set environment variables (copy from `.env.example`)
4. Railway auto-detects `railway.toml` — deploys server + runs migrations

The `railway.toml` in this repo configures:
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npx prisma migrate deploy && node server/dist/index.js`
- Static client served from `client/dist`

### Render

Use `render.yaml` in this repo which defines:
- A web service for the Node.js API
- A static site for the Vite frontend
- Auto-run DB migrations on deploy

### Manual VPS

```bash
# Build
cd server && npm run build
cd ../client && npm run build

# Run
NODE_ENV=production node server/dist/index.js
```

Serve `client/dist` via nginx or a static host (Vercel, Netlify, Cloudflare Pages).

---

## Progression System

### XP & Leveling

- Each set logged grants XP based on weight × reps + RPE modifier
- PRs grant +50 bonus XP
- 7+ days inactive → next session grants 2× XP (Rested Bonus)
- Level thresholds scale: 100xp (L1-10) → 200 (L11-20) → 400 (L21-30) → 750 (L31-40) → 1500xp (L41-50)

### Rank Badges (per discipline)

| Levels | Badge |
|---|---|
| 1–10 | Iron Body |
| 11–20 | Bronze Warrior |
| 21–30 | Silver Champion |
| 31–40 | Gold Titan |
| 41–49 | Platinum Sovereign |
| 50 | Mythic Archon |

### Leagues

| League | Score Range | Monster Tier |
|---|---|---|
| Iron | 0–999 | Common |
| Awakening | Hidden gate | Rare (must beat 5 + 4wk streak) |
| Bronze | 1000–2999 | Rare |
| Silver | 3000–5999 | Epic |
| Gold | 6000–9999 | Legendary |
| Mythic | 10000+ | Ancient |

### Promotion Gates

- Top 15% of league + 10 sessions in last 30 days
- 3 sessions/week for 3 of the 4 weeks in tournament month
- Balance check: lowest discipline cannot be 15+ levels below highest
- Body fat gates: Bronze→Silver (28%/35%), Silver→Gold (22%/30%), Gold→Mythic (18%/26%)

---

## Contributing

PRs welcome. Keep the dark fantasy vibe.

---

## License

MIT
