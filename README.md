# Sentinella

A mobile-first travel safety and security app for a specific group of travelers in Italy. It puts one-tap emergency calling, embassy contacts, field briefings (scams, emergency Italian, city notes, healthcare), team advisories, and location check-ins into a single installable web app that keeps working when the connection doesn't.

Built with Next.js 14, Tailwind, Drizzle ORM, and PostgreSQL. Designed to be developed in Cursor, versioned on GitHub, and deployed on Railway.

## How access works

The app is reachable on the public web. Registration is config-driven: set `INVITE_CODES` (comma-separated) and creating an account requires one of those codes — compared trimmed and case-insensitively — which keeps access limited to your traveler group. Leave `INVITE_CODES` unset or empty and registration is open to anyone; the register form hides the invite field entirely. Safety-critical content — the Emergency screen and the Guide — is deliberately public and never behind a login, because nobody should fumble with a password during an incident. Check-ins and alert publishing require an account; alert publishing additionally requires the admin role (granted automatically to emails listed in `ADMIN_EMAILS`).

## Features

- **Emergency screen.** Every number is a signage-style plate that dials on tap: 112 plus direct lines (113, 115, 118, 1530) and support lines (1522, 116 117, roadside, poison control). Includes a what-to-say call script, embassy contacts for six countries, and lost-passport steps.
- **Share my position.** Captures GPS, shows coordinates you can read to a 112 operator, and shares a maps link via the system share sheet or clipboard.
- **Field guide.** Situational basics (strikes, ZTL zones, earthquakes, ticket validation), the ten scams that actually run in Italy with counters, emergency Italian with pronunciation, briefings for Rome, Milan, Naples, Florence, Venice, and southern driving, and how Italian healthcare works for visitors.
- **Check-ins.** Timestamped safe/caution/help statuses with optional GPS and notes, building a trail per traveler. Selecting "need help" surfaces a call-112 prompt, because a check-in is not monitored in real time.
- **Alerts.** Advisories published by your admins (strikes, weather, local conditions), readable by anyone, with severity levels.
- **Offline map.** `/map` renders vector city maps (MapLibre + PMTiles) with a GPS blue dot and your current coordinates. Per-city packs — Rome, Florence, Venice, Milan, Naples — download on a switch into IndexedDB and keep the map fully working with no connection, including street labels.
- **Offline by design.** A service worker precaches the Emergency, Guide, and Map screens; all reference data ships in the JS bundle, not the database. Installable to the home screen (PWA).

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

Register through the UI — with one of your invite codes if `INVITE_CODES` is set, or directly if it's empty. If the email is listed in `ADMIN_EMAILS`, the account gets the admin role and a "Publish an alert" form appears on the Alerts screen.

Note: the service worker registers only in production builds, so offline behavior is tested with `npm run build && npm run start`, not `npm run dev`.

## Offline map packs

The Map screen streams vector tiles from `public/map-packs/<city>.pmtiles` — over HTTP range requests when online, or from a Blob in IndexedDB after the user flips a city's download switch. The committed packs cover the metro areas of Rome, Florence, Venice, Milan, and Naples at zoom 0–14 (buildings and street detail included), each well under 40 MB.

To regenerate or add cities, install the [pmtiles CLI](https://github.com/protomaps/go-pmtiles) (`brew install pmtiles`) and run:

```bash
node scripts/build-map-packs.mjs                       # all cities
PROTOMAPS_BUILD=20260722 MAXZOOM=14 node scripts/build-map-packs.mjs rome
```

The script extracts each city's bounding box from a [Protomaps daily build](https://build.protomaps.com) (OpenStreetMap data), writes the packs, and regenerates the `src/data/mapPacks.ts` manifest with real byte sizes. To add a city, add its bbox to the `CITIES` array in the script and re-run; keep each pack under ~40 MB (GitHub warns at 50 MB) by trimming the bbox or lowering `MAXZOOM`. Label glyphs are self-hosted under `public/map-fonts/` (Noto Sans, Latin ranges from [basemaps-assets](https://github.com/protomaps/basemaps-assets)) so text renders offline; the hand-written style lives in `src/lib/mapStyle.ts`.

## Notifications (Web Push)

Signed-in users can enable push notifications from the card on the home screen: official U.S. advisory updates, team alerts, and check-in reminders, each individually toggleable. The server needs VAPID keys in its environment — generate a pair with:

```bash
npx web-push generate-vapid-keys
```

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a `mailto:` contact URL) locally and on Railway. Without them the app runs fine and push sends become logged no-ops.

iOS reality check: iPhones and iPads only receive web push on iOS 16.4+ **and** with the app installed to the home screen — Safari tabs can't receive notifications, so the UI shows install guidance there instead of a permission prompt.

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
   - `INVITE_CODES` → e.g. `ROMA-TEAM-26,MILAN-OPS-26` (optional — omit to open registration to anyone)
   - `ADMIN_EMAILS` → comma-separated admin emails
4. **Deploy.** The start command (`npm run start:railway`) applies pending Drizzle migrations before booting, so the schema is created on first deploy automatically.
5. **Seed sample alerts (optional).** With the [Railway CLI](https://docs.railway.com/guides/cli): `railway link`, then `railway run npm run db:seed`.
6. **Domain.** Settings → Networking → Generate Domain (or attach your own). HTTPS is automatic, which the PWA and geolocation both require.

Every push to `main` redeploys. Migrations you generate locally (`npm run db:generate` after schema changes, committed under `drizzle/`) are applied on the next deploy.

### Scheduled jobs (advisories + warnings + reminders)

Four authenticated endpoints do the recurring work; schedule them with Railway cron services in the same project:

- `GET /api/cron/refresh-advisories` — refreshes the official U.S. feeds and push-notifies new items. Run **every 6 hours** (`0 */6 * * *`).
- `GET /api/cron/refresh-warnings` — refreshes MeteoAlarm weather warnings (Lazio/Toscana) and INGV earthquakes. Run **every 30 minutes** (`*/30 * * * *`).
- `GET /api/cron/refresh-gdacs` — refreshes GDACS disaster events for Italy. Run **hourly** (`0 * * * *`).
- `GET /api/cron/checkin-reminders` — sends overdue check-in reminders and escalates unanswered ones to admins. Run **every 15 minutes** (`*/15 * * * *`).

All require `Authorization: Bearer ${CRON_SECRET}`. Set `CRON_SECRET` (e.g. `openssl rand -hex 32`) on the app service first, then for each job: **New → Empty Service**, set the Docker image to `curlimages/curl:latest`, add a `CRON_SECRET` variable referencing the app's (`${{Sentinella.CRON_SECRET}}`), set the **Cron Schedule** from the list above, and set the start command to the matching curl:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.up.railway.app/api/cron/refresh-advisories
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.up.railway.app/api/cron/refresh-warnings
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.up.railway.app/api/cron/refresh-gdacs
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.up.railway.app/api/cron/checkin-reminders
```

The same commands (with the secret filled in) are also the manual test: a JSON summary comes back — `{"state":"ok","embassy":"ok","newItems":0}` / `{"meteoalarm":"ok","ingv":"ok","newItems":0}` / `{"gdacs":"ok","newItems":0}` / `{"reminded":0,"escalated":0}` — and anything else means check the app service logs.

If the app misses a cron run (e.g. the service was asleep), `/api/warnings` also refreshes inline on read, respecting each source's cadence, so the data self-heals on the next visit.

## Project structure

```
src/app            pages + API route handlers (App Router)
src/components     UI (CallPlate is the signature signage component)
src/data           typed static safety content — bundled so it works offline
src/db             Drizzle schema, client, seed
src/lib            JWT auth + session helpers, map style + offline pack storage
src/middleware.ts  auth gate for /checkin and /api/checkins
drizzle/           generated SQL migrations (committed)
scripts/           build-map-packs.mjs (extracts city .pmtiles from Protomaps)
public/sw.js       service worker (offline strategy)
public/map-packs/  committed per-city offline map packs (.pmtiles)
public/map-fonts/  self-hosted label glyphs for offline rendering
.cursorrules       Cursor AI context for this codebase
```

## Data accuracy — read this once

The core emergency numbers (112, 113, 115, 118) are stable and nationwide. Embassy switchboards, poison-control lines, and similar directory data were correct when written but change; verify them against official sources before your group relies on them, and keep the in-app "verify" caveats when editing. This app is an aid, not a monitored emergency service — the UI says so, and it should stay that way.

## Roadmap ideas

Trip itineraries with per-traveler assignments; a team dashboard where admins see everyone's latest check-in on a map; scheduled check-in reminders with escalation when one is missed (push via web-push); SMS fallback through Twilio; per-code invite tracking in the database; automated advisory ingestion from official feeds; Italian UI localization; rate limiting on auth endpoints.

## License

Private project scaffold — add the license your organization requires.
