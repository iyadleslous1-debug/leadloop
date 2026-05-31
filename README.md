# LeadLoop

AI-powered WhatsApp real estate assistant for Algerian agencies. Each agency brings their own WhatsApp number via Twilio, with Groq AI handling buyer conversations in Arabic, French, Darija, and English.

## Env vars

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `GROQ_API_KEY` | Yes | Groq API key for AI (llama-3.1-8b-instant) |
| `ADMIN_EMAIL` | No | Email address that gets access to `/dashboard/admin` |

## Getting Started

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push to GitHub
2. Import into Vercel
3. Set all env vars above in Vercel project settings
4. Deploy

## Uptime Monitoring

LeadLoop exposes a health check endpoint at `/api/health`. It returns:
- `status: "ok"` when everything is healthy
- Server uptime in seconds
- Environment variables presence check (keys are validated, secrets never exposed)
- Database connectivity check

**Recommended:** Set up [UptimeRobot](https://uptimerobot.com) (free tier) to monitor `/api/health` every 5 minutes. You'll get alerted if the app goes down.

1. Create a free UptimeRobot account
2. Add a new monitor
3. Type: HTTP(S)
4. URL: `https://your-domain.vercel.app/api/health`
5. Interval: 5 minutes
6. Alert if down: Yes

## Database

This app uses Supabase. Run `scripts/init.sql` in the Supabase SQL editor when setting up a new project.

## Architecture

- **Auth**: Supabase Auth with JWT session cookies
- **AI**: Groq (llama-3.1-8b-instant) via REST API
- **WhatsApp**: Twilio API — each agency connects their own Twilio account
- **Cron**: Vercel Cron Jobs — `/api/cron/follow-ups` runs every hour for drip follow-ups; `/api/cron/archive` archives conversations inactive for 90+ days
- **Export**: CSV download for leads, properties, conversations
- **Admin**: `/dashboard/admin` gated by `ADMIN_EMAIL` env var

## Production Hardening

### CSRF Protection

All mutating API requests (POST, PUT, PATCH, DELETE) validate the `Origin` or `Referer` header against the app's own domain. Requests without a matching origin are rejected with 403. A CSRF token cookie is set on first visit for double-submit cookie pattern compatibility.

### Audit Logs

Every mutation to leads, properties, conversations, suggestions, and bookings is logged to the `audit_logs` table with user ID, action name, details, and IP address. Viewable per-user in the admin dashboard.

### Backup Strategy

Supabase provides automated daily backups on the Pro plan. To manually trigger a backup:

```bash
# Install Supabase CLI
# Login
supabase login
# Link project
supabase link --project-ref <ref>
# Backup
supabase db dump -f backup_$(date +%Y-%m-%d).sql
```

### Restore Procedure

```bash
supabase db restore --file backup_2026-01-01.sql
```

Or restore via the Supabase Dashboard: Database → Backups → Restore.

### Secret Rotation

1. Rotate env vars in Vercel Dashboard (Settings → Environment Variables)
2. Rotate Supabase service role key in Supabase Dashboard (Settings → API)
3. Rotate Twilio credentials in Twilio Console
4. Update integration rows in the `integrations` table if per-user creds changed
5. Recommended: rotate keys every 90 days

Run `npm run build` after any env var change to confirm the app starts cleanly.
