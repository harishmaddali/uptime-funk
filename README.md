# Uptime Funk

Next.js app for monitoring HTTP endpoints with a dashboard, public status pages, and multi-channel alerts.

## Stack

- **Drizzle ORM** + **better-sqlite3** (swap to Postgres + `drizzle-orm/pg` in production if you like)
- **Better Auth** — email/password, **email verification via OTP** (Resend), **Google** & **GitHub** OAuth
- **shadcn-style** UI (Radix + Tailwind)

## Auth flow

1. **Sign up** with email/password → Better Auth sends a **6-digit OTP** via Resend (`emailOTP` plugin, `overrideDefaultEmailVerification`).
2. User opens **`/verify-email`**, enters the code → `authClient.emailOtp.verifyEmail`.
3. **Sign in** with email/password (`requireEmailVerification: true` blocks unverified accounts).
4. **Google / GitHub**: configure OAuth env vars and set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` / `NEXT_PUBLIC_GITHUB_AUTH_ENABLED=true` so the buttons show on `/login` and `/signup`.

## Setup

```bash
cp .env.example .env
# Required: BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, EMAIL_FROM, DATABASE_URL

npm install
npm run db:push   # applies Drizzle schema to SQLite
npm run dev
```

### Regenerating Better Auth tables

If you change Better Auth plugins/options, refresh the generated Drizzle file:

```bash
npm run auth:schema
npm run db:push
```

## Scripts

- `npm run db:push` — `drizzle-kit push` (dev-friendly schema sync)
- `npm run db:studio` — Drizzle Studio
- `npm run auth:schema` — regenerate `src/db/auth-schema.ts` from `better-auth.cli.ts`

## Scheduler

`GET /api/cron/check-monitors` with `Authorization: Bearer <CRON_SECRET>` — run on your shortest monitor interval.

## Production

- Set a strong **`BETTER_AUTH_SECRET`** (do not rely on the dev fallback).
- Use a hosted DB + update `DATABASE_URL` and Drizzle dialect if needed.
- Set **`BETTER_AUTH_URL`** to your public origin (OAuth callbacks).

## License

MIT
