# ClientTrack

A tool for freelancers to scope a client project, let an LLM split it into a
week-by-week task plan, and send the client a link where they can watch
progress — no login required on their side.

- **Backend:** FastAPI + SQLAlchemy (SQLite by default, Postgres-ready), JWT
  auth, bcrypt password hashing, rate limiting, Anthropic API for the task
  breakdown.
- **Frontend:** React + Vite, React Router, styled to match the dashboard
  design you shared.

## How it works

1. You register/log in and create a project: client name, project type,
   description, number of pages (if a website), and how many weeks/days you
   want to spend on it.
2. On creation, the backend calls the Anthropic API with that brief and gets
   back a week-by-week task list, saved to the project.
3. You get an **owner view** (`/projects/:id`) where you can check off tasks
   and change status.
4. Each project gets an unguessable **share link** (`/track/:token`) — send
   that to your client. They see the same weekly plan, read-only, with no
   account needed.

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- Set `SECRET_KEY` to a real random value:
  `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- Set `ANTHROPIC_API_KEY` to your key from console.anthropic.com. Without
  it, project creation still works — it falls back to a simple generic
  weekly template instead of an LLM-generated one.

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at `/docs` (dev only).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`.

## Deploying

- **Database:** switch `DATABASE_URL` in the backend `.env` to a managed
  Postgres instance (Railway, Render, Supabase, RDS, etc.) — the code
  already uses SQLAlchemy so no code changes are needed.
- **Backend:** any host that runs a Python/ASGI app (Render, Railway, Fly.io,
  a VPS behind Nginx). Run with `uvicorn app.main:app` behind a process
  manager, and put it behind HTTPS.
- **Frontend:** `npm run build` produces a static `dist/` folder — deploy it
  to Vercel, Netlify, Cloudflare Pages, or any static host. Set
  `VITE_API_URL` to your deployed backend URL and `VITE_PUBLIC_APP_URL` to
  your deployed frontend URL (used to build the client share link).
- Set `CORS_ORIGINS` in the backend `.env` to your deployed frontend's exact
  origin, and set `ENVIRONMENT=production` (this hides `/docs` and adds
  HSTS).

## Security notes

- Passwords are hashed with bcrypt, never stored in plain text.
- Auth uses short-lived JWTs (24h by default) sent as a Bearer token.
- Login/register are rate-limited to slow down credential-stuffing attempts.
- Client tracker links use a 32-byte random token (not a guessable ID) and
  are read-only — clients can never write to your data. You can rotate a
  link at any time if it leaks, and toggle sharing off without deleting the
  project.
- All project/task endpoints check that the authenticated user actually
  owns the project (no editing someone else's data by guessing an ID).
- Every input is validated with Pydantic; the ORM (SQLAlchemy) parameterizes
  queries, so there's no raw SQL string-building.
- Generic error messages on login/registration (doesn't reveal whether an
  email is registered).
- Unhandled server errors return a generic message — no stack traces are
  ever sent to the client.

## What I'd add next

- Password reset flow (email-based)
- Refresh tokens instead of a single long-lived access token
- Client-side comments on tasks (still no login — tied to the share token)
- Email notifications to the client when a milestone completes
- Alembic migrations instead of `create_all` for schema changes in production
