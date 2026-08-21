# Upswell Event Check-in

A mobile-first event registration and QR check-in app for campus food activations.

## What it does

- Creates reusable restaurant / campus events
- Generates a tracked registration link for each student club
- Collects attendee name, phone number, and club
- Returns a unique QR pass immediately after registration
- Provides a fast camera scanner that automatically resets for the next attendee
- Prevents duplicate check-ins and flags already-used passes
- Supports manual name / phone lookup when a QR cannot be scanned
- Provides a venue walk-in QR so students can register on the spot
- Tracks registered, checked-in, not-arrived, and walk-in counts
- Exports attendance as CSV

## Stack

- Next.js + TypeScript
- Supabase Postgres
- `html5-qrcode` for staff scanning
- `qrcode.react` for passes and venue signup QR codes

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In Supabase SQL Editor, run `supabase/schema.sql`. Optionally run `supabase/seed.sql` for a demo event.

4. Copy `.env.example` to `.env.local` and fill in:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never expose the Supabase service-role key in browser code.

5. Start the app:

```bash
npm run dev
```

6. Open `/admin` directly, create an event, add clubs, and copy each club's registration link. There is no staff PIN or login screen.

## Event-day flow

1. Staff opens `/admin/events/[event-id]/scanner` on a phone.
2. Student shows their pass QR.
3. Scan it once; the screen confirms the attendee and automatically returns to scanning mode.
4. If the student never registered, they scan the venue signup QR, register on their own phone, then show the new pass.
5. If scanning fails, staff searches name or phone and checks the person in manually.

## Privacy / security

Phone numbers are operational event data. Do not commit exports, Supabase keys, or attendee data to GitHub. Because the admin area is intentionally passwordless, restrict deployment access appropriately if the dashboard should not be public.
