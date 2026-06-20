# Filmly — Setup Guide

## Prerequisites
- Node.js 18+
- A TMDB API key (themoviedb.org)
- A Supabase project (supabase.com)

## 1. Install dependencies

```bash
cd film
npm install
```

## 2. Environment variables

Your `.env.local` is already configured. Do not commit it.

## 3. Set up the Supabase database

Go to your Supabase project → SQL Editor, paste the contents of:

```
supabase/migrations/001_initial.sql
```

Run it. This creates the `profiles` and `film_interactions` tables with RLS.

## 4. Enable Google auth in Supabase

Go to Supabase → Authentication → Providers → Google.
Enable it and add your Google OAuth credentials.

Set the redirect URL to:
- Local: `http://localhost:3000/auth/callback`
- Production: `https://your-domain.com/auth/callback`

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 6. Deploy to Vercel

```bash
npx vercel
```

Add these environment variables in Vercel project settings:
- `TMDB_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_SERVICE_ROLE` (optional, for future admin features)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — trending & popular |
| `/search?q=...` | Search results |
| `/films/[id]` | Film detail + recommendations |
| `/genres` | Genre browser |
| `/genres/[id]` | Films by genre |
| `/favourites` | Your liked/favourited films |
| `/recommendations` | Personalised picks based on likes |

## How interactions work

Hover any film card to see like 👍 / favourite ❤️ / dislike 👎 buttons.
- Likes and dislikes are mutually exclusive
- Favourites are independent
- Dislikes are excluded from recommendations
