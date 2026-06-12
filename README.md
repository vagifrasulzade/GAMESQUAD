# GameSquad

**Find Your Squad. Play. Win. Repeat.** — a gamer matchmaking platform with an
AI-powered matching engine.

## Goal

Finding the right people to play with is hard: players are scattered across
games, ranks, regions, languages and play styles, and most "looking for group"
tools are just noisy chat channels. **GameSquad's goal is to connect gamers with
the teams, clans and teammates that actually fit them.**

Players build a profile (games, rank, role, play style, activity, language), and
the platform's matching engine scores every team and clan against that profile
to surface the best fits with a clear compatibility breakdown — and an AI
assistant that explains *why* each match is a good one. Teams and clans can
recruit, players can apply, message, save listings and discover events, all in
one place.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4
- **Backend:** Django 6 + Django REST Framework + SimpleJWT
- **AI:** Groq (primary) → OpenRouter (fallback) → heuristic mode (no key needed)

## Run the backend

```powershell
cd backend
uv run python manage.py migrate
uv run python manage.py seed          # demo games, users, teams, clans, recruitments
uv run python manage.py runserver
```

- API root: http://127.0.0.1:8000/api/
- Swagger docs: http://127.0.0.1:8000/api/docs/
- Admin panel: http://127.0.0.1:8000/admin/  (superuser: `admin` / `admin12345`)
- Demo gamer login: `Vaqif` / `demo12345`

### AI keys (optional)

Copy `backend/.env.example` to `backend/.env` and set `GROQ_API_KEY` and/or
`OPENROUTER_API_KEY`. Without keys the matcher still runs in heuristic mode and
the assistant returns rule-based replies.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Set `VITE_API_URL` if the backend is not on `http://127.0.0.1:8000/api`.

## API overview

| Area        | Endpoints |
|-------------|-----------|
| Auth        | `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/` |
| Profile     | `GET/PATCH /api/users/me/`, `GET /api/users/` |
| Catalog     | `GET /api/games/` |
| Teams       | `GET/POST /api/teams/`, `POST /api/recruitments/{id}/apply/` |
| Clans       | `GET/POST /api/clans/`, `POST /api/clans/{id}/join/` |
| Recruitment | `GET/POST /api/recruitments/`, `GET /api/applications/` |
| Social      | `/api/conversations/`, `/api/notifications/`, `/api/saved/`, `/api/reports/` |

## How AI matching works

`apps/matching/service.py` scores every team/clan against the user across role,
rank/game, playstyle, activity and language to produce a compatibility % and a
sub-score breakdown. The top matches are then enriched with short "why it's a
great match" reasons written by the LLM (`apps/matching/ai.py`), and the chat
assistant streams answers grounded in the user's top match.
