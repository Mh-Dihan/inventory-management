# Deployment

## Architecture

- Frontend: Vercel
- Backend: Render
- Database: Neon Postgres

## 1. Neon

Create a free Neon project and copy its connection string.

- Use the pooled connection string if Neon provides one.
- Set `DATABASE_URL` to that value.

## 2. Backend on Render

Create a new Web Service from this GitHub repo.

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn wsgi:app`

Set these environment variables in Render:

- `DATABASE_URL`: your Neon connection string
- `SEED_DATA`: `true` for sample data on first boot, otherwise `false`
- `CORS_ORIGINS`: your Vercel frontend URL, for example `https://frontend-phi-one-94.vercel.app`

If your database URL starts with `postgres://`, the app converts it automatically.

## 3. Frontend on Vercel

In the Vercel project for `frontend`, set:

- `VITE_API_BASE_URL`: your Render backend URL plus `/api`

Example:

`https://inventory-management-api.onrender.com/api`

Then redeploy the frontend.

## Local Development

Backend:

- Copy `backend/.env.example` to `backend/.env`
- Default local SQLite works without extra setup

Frontend:

- Copy `frontend/.env.example` to `frontend/.env.local`
- For local proxy mode, you can also omit `VITE_API_BASE_URL`
