# Uptime Funk

Next.js app for monitoring HTTP endpoints (services, APIs, feature-flag URLs) with a dashboard, per-monitor settings, public status pages, and multi-channel alerts.

## Features

- **Monitors**: URL, HTTP method, expected status code, optional body substring, interval (1 min → 1 hr), enable/disable, optional public status page (`/status/<slug>`).
- **Notifications**: Account-wide **default channels** (email, SMS, Slack, Telegram) plus **per-monitor overrides** when “custom notification settings” is enabled.
- **Slack**: OAuth install stores webhook + token (`/api/integrations/slack/*`). Configure `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `AUTH_URL`.
- **Email**: [Resend](https://resend.com) — `RESEND_API_KEY`, `EMAIL_FROM`.
- **SMS**: Twilio — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- **Telegram**: `TELEGRAM_BOT_TOKEN` + per-user chat id in Settings.
- **Scheduler**: `GET /api/cron/check-monitors` with header `Authorization: Bearer <CRON_SECRET>`. Run at least as often as your shortest interval.

## UI

Built with **shadcn/ui**-style components (Radix + Tailwind). `components.json` is included for adding more primitives via:

```bash
npx shadcn@latest add dialog
```

## Setup

```bash
cp .env.example .env
# Set AUTH_SECRET (32+ random bytes), DATABASE_URL, CRON_SECRET, etc.

npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, add monitors, configure integrations under **Settings**.

## Production notes

- Use PostgreSQL: change `provider` in `prisma/schema.prisma` and `DATABASE_URL`.
- Set `AUTH_URL` to your public origin for Slack OAuth redirect.
- Point your cron (Vercel Cron, GitHub Actions, etc.) at `/api/cron/check-monitors`.

## License

MIT
