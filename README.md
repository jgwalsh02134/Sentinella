# Sentinella

A mobile-first travel safety and security app for a specific group of travelers in Italy. It puts one-tap emergency calling, embassy contacts, field briefings (scams, emergency Italian, city notes, healthcare), team advisories, and location check-ins into a single installable web app that keeps working when the connection doesn't.

Built with Next.js 14, Tailwind, Drizzle ORM, and PostgreSQL. Designed to be developed in Cursor, versioned on GitHub, and deployed on Railway.

## How access works

The app is reachable on the public web, but it is not a consumer product: creating an account requires an invite code you control (`INVITE_CODES`). Safety-critical content — the Emergency screen and the Guide — is deliberately public and never behind a login, because nobody should fumble with a password during an incident. Check-ins and alert publishing require an account; alert publishing additionally requires the admin role (granted automatically to emails listed in `ADMIN_EMAILS`).

## Features

- **Emergency screen.** Every number is a signage-style plate that dials on tap: 112 plus direct lines (113, 115, 118, 1530) and support lines (1522, 116 117, roadside, poison control). Includes a what-to-say call script, embassy contacts for six countries, and lost-passport steps.
- **Share my position.** Captures GPS, shows coordinates you can read to a 112 operator, and shares a maps link via the system share sheet or clipboard.
- **Field guide.** Situational basics (strikes, ZTL zones, earthquakes, ticket validation), the ten scams that actually run in Italy with counters, emergency Italian with pronunciation, briefings for Rome, Milan, Naples, Florence, Venice, and southern driving, and how Italian healthcare works for visitors.
- **Check-ins.** Timestamped safe/caution/help statuses with optional GPS and notes, building a trail per traveler. Selecting "need help" surfaces a call-112 prompt, because a check-in is not monitored in real time.
- **Alerts.** Advisories published by your admins (strikes, weather, local conditions), readable by anyone, with severity levels.
- **Offline by design.** A service worker precaches the Emergency and Guide screens; all reference data ships in the JS bundle, not the database. Installable to the home screen (PWA).

## Local development

Prerequisites: Node 18.17+ (20+ recommended) and a PostgreSQL database. The fastest path with zero local installs is to create the Railway Postgres first (step 3 below) and point your local `.env` at it.

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, AUTH_SECRET, INVITE_CODES, ADMIN_EMAILS
npm run db:migrate          # apply schema (or: npm run db:push while iterating)
npm run db:seed             # optional: sample alerts
npm run dev                 # http://localhost:3000
```

Generate a strong `AUTH_SECRET` with `openssl rand -base64 48`.

Register through the UI using one of your invite codes. If the email is listed in `ADMIN_EMAILS`, the account gets the admin role and a "Publish an alert" form appears on the Alerts screen.

Note: the service worker registers only in production builds, so offline behavior is tested with `npm run build && npm run start`, not `npm run dev`.

## Working in Cursor

Open the folder in Cursor and it will pick up `.cursorrules`, which teaches the AI the stack, commands, and the project's non-negotiables (red is reserved for emergency actions, safety content stays public and offline-capable, schema changes require generated migrations, etc.). Good first prompts: "add an itinerary table and screen following the existing conventions" or "add pagination to check-in history."

## GitHub

```bash
git init
git add .
git commit -m "Sentinella: initial scaffold"
git branch -M main
# create an empty repo on github.com (no README), then:
git remote add origin https://github.com/<you>/sentinella.git
git push -u origin main
```

Or with the GitHub CLI: `gh repo create sentinella --private --source=. --push`.

`.env` is gitignored — keep it that way. Secrets live in Railway variables and your local `.env` only.

## Deploying on Railway

1. **Create the project.** In Railway: New Project → Deploy from GitHub repo → pick `sentinella`. Railway detects Next.js via Nixpacks; `railway.json` sets the start command.
2. **Add PostgreSQL.** In the same project: New → Database → PostgreSQL.
3. **Set variables** on the app service (Variables tab):
   - `DATABASE_URL` → add a reference: `${{Postgres.DATABASE_URL}}`
   - `AUTH_SECRET` → long random string
   - `INVITE_CODES` → e.g. `ROMA-TEAM-26,MILAN-OPS-26`
   - `ADMIN_EMAILS` → comma-separated admin emails
4. **Deploy.** The start command (`npm run start:railway`) applies pending Drizzle migrations before booting, so the schema is created on first deploy automatically.
5. **Seed sample alerts (optional).** With the [Railway CLI](https://docs.railway.com/guides/cli): `railway link`, then `railway run npm run db:seed`.
6. **Domain.** Settings → Networking → Generate Domain (or attach your own). HTTPS is automatic, which the PWA and geolocation both require.

Every push to `main` redeploys. Migrations you generate locally (`npm run db:generate` after schema changes, committed under `drizzle/`) are applied on the next deploy.

## Project structure

```
src/app            pages + API route handlers (App Router)
src/components     UI (CallPlate is the signature signage component)
src/data           typed static safety content — bundled so it works offline
src/db             Drizzle schema, client, seed
src/lib            JWT auth + session helpers
src/middleware.ts  auth gate for /checkin and /api/checkins
drizzle/           generated SQL migrations (committed)
public/sw.js       service worker (offline strategy)
.cursorrules       Cursor AI context for this codebase
```

## Data accuracy — read this once

The core emergency numbers (112, 113, 115, 118) are stable and nationwide. Embassy switchboards, poison-control lines, and similar directory data were correct when written but change; verify them against official sources before your group relies on them, and keep the in-app "verify" caveats when editing. This app is an aid, not a monitored emergency service — the UI says so, and it should stay that way.

## Roadmap ideas

Trip itineraries with per-traveler assignments; a team dashboard where admins see everyone's latest check-in on a map; scheduled check-in reminders with escalation when one is missed (push via web-push); SMS fallback through Twilio; per-code invite tracking in the database; automated advisory ingestion from official feeds; Italian UI localization; rate limiting on auth endpoints.

## License

Private project scaffold — add the license your organization requires.
