# Wedding Design Planner

Production-style MVP for planning **wedding and event seating** and **2D venue layouts**—cream-and-gold editor tuned for garden estates, cool-climate ballrooms, and mountain-resort receptions.

## Features

- **Supabase auth** — email/password sign-up and sign-in; protected dashboard and layout routes; **forgot password** with email reset and optional **Cloudflare Turnstile** on the reset request.
- **Dashboard** — list layouts with last updated time; create with **venue setting** (ballroom, church, or outdoor/garden), **adjustable page size**, optional **starter template** per venue, duplicate, and delete.
- **Layout editor** — drag objects from the library onto the canvas, move and resize, rotate, duplicate/delete selection, **zoom**, **grid** and **snap-to-grid**, **auto-save** every **10 minutes** when there are unsaved changes (keeps Supabase writes light on the free tier), plus **Save now**, unsaved indicator.
- **Guest support** — for tables and similar objects: seat count, guest names (one per line), notes.
- **Row Level Security** — each user only sees and mutates their own `layouts` rows.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · ShadCN UI (Base UI) · Supabase (Auth + Postgres) · Zustand · React Hook Form + Zod · Sonner · Vercel-ready.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the database schema using **one** of these:

   **A — SQL Editor (simplest)**  
   Dashboard → **SQL Editor** → **New query** → paste the full contents of  
   `supabase/migrations/` **in order** (e.g. `20250527000000_init.sql` then `20250529130000_layout_venue_setting.sql`) → **Run**.

   **B — From your machine (`npm run db:apply`)**  
   1. In Supabase: **Connect** → copy the **Postgres URI** under **Session pooler** (IPv4-friendly).  
      Avoid **Direct connection** (`db.*.supabase.co`) on networks without IPv6 — you may see `no route to host`.  
   2. Add to **`.env.local`** (gitignored), not only API keys:

      ```bash
      DATABASE_URL=postgresql://postgres...
      ```

   3. From the project root (applies every `*.sql` in `supabase/migrations/` in sorted order):

      ```bash
      npm run db:apply
      ```

      This uses **`psql`** when installed (recommended): migration files contain many statements, and  
      `npx supabase db query -f` cannot run them (Postgres error *multiple commands into a prepared statement*).  
      If `psql` is missing, the script falls back to the CLI and may fail — install `psql` (`brew install libpq` on macOS) or use the SQL Editor.

   The **publishable / anon** keys are for the **Data API** only; they **cannot** create tables or run arbitrary SQL migrations. **`@supabase/supabase-js`** uses those keys — same limitation. You need the **database connection string** (or the SQL Editor) for migrations.

   > I can’t run this against your project from chat without your DB password. After you add `DATABASE_URL` locally, `npm run db:apply` runs entirely on your machine.

3. **Auth URL configuration** (Authentication → URL configuration): add your local and production site URLs (e.g. `http://localhost:3003`, `https://your-app.vercel.app`).

4. **Password reset redirect** — add these to **Redirect URLs** (same Auth settings section):

   - `http://localhost:3003/auth/confirm`
   - `https://your-production-domain/auth/confirm`

   The app sends users through `/auth/confirm` (session exchange) then to `/auth/update-password`. That route accepts **either** Supabase’s default **PKCE** redirect (`?code=…`, same browser where you requested the reset — cookies must be present) **or** a **token hash** link from a customized template (`?token_hash=…&type=recovery`, works on another device). If reset links land on an error page, confirm redirect URLs and see the [password reset guide](https://supabase.com/docs/guides/auth/passwords#forgot-password).

   **Sign-up confirmation** emails use the same `/auth/confirm` route with `next=/dashboard` (set in code). Use the same redirect URL allow list as above (match your dev port, e.g. `http://localhost:3003/auth/confirm`).

5. **Email template (hosted projects)** — under **Authentication** → **Emails** → **Reset password**, ensure the message uses Supabase’s confirmation URL so the link hits your `/auth/confirm` route with `token_hash` and `type=recovery` (see the same passwords guide).

> If your Postgres version errors on `execute function` in triggers, try `execute procedure` instead for `handle_new_user` and `set_updated_at`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Dashboard → **Project Settings** → **Data API** or **API**). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable** key (`sb_publishable_…`) — recommended; same role as the old anon key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Optional)* Legacy **anon** JWT only if your project has not migrated to publishable keys yet. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | *(Recommended production)* [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) **site** key — shown on the forgot-password page. |
| `TURNSTILE_SECRET_KEY` | Turnstile **secret** key — server-only; used to verify the widget token before calling Supabase. In `NODE_ENV=development`, if both Turnstile vars are empty, the app uses Cloudflare’s public test keys so local reset works without setup. |
| `DATABASE_URL` | *(Optional, local only)* Postgres URI from **Connect** — used by `npm run db:apply` to run SQL migrations. Never commit; do not add to Vercel unless you have a dedicated migration path. |

This app only uses the **publishable** (or legacy anon) key in the browser and in cookie-based SSR — so **Row Level Security** still applies. **Do not** put **secret** keys (`sb_secret_…`) or **service_role** JWTs in `NEXT_PUBLIC_*` or client bundles; they bypass RLS.

Never commit `.env.local`.

### Auth troubleshooting (signup / login / email limits)

- **Users are not in `public` tables by default.** Registered users appear under **Supabase Dashboard → Authentication → Users**, not only in the SQL **Table Editor** for `public.*`. The `profiles` row is created by a trigger **when** `auth.users` gets a real insert.
- **Response with `identities: []`:** The signup form treats this as **email already registered** (Supabase anti-enumeration) and shows a field error — use **Sign in** or **Forgot password**. With **Confirm email** off, you may instead get an explicit API error, which is handled the same way.
- **“Email not confirmed” on login:** Confirm the address from the email link, use **Resend confirmation email** on the login page, or (for local testing) open the user in the dashboard and confirm manually / temporarily disable **Confirm email** under Authentication providers.
- **`fetch failed` / `[middleware] Supabase getUser` in the terminal:** Next.js **Edge** (see `proxy.ts`) cannot reach `http://127.0.0.1:54321` or `http://localhost:54321` — that “localhost” is not your Mac. Use your **hosted** `https://*.supabase.co` URL in `NEXT_PUBLIC_SUPABASE_URL` for this app, or rely on the built-in **cookie session** path when the URL is loopback (see `lib/supabase/middleware.ts`). For hosted projects, still verify the URL, keys, network/VPN, and that the project is not paused.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003), sign up, then open **Dashboard** → **New layout**.

### 5. Deploy to Vercel

1. Push this repo to GitHub and import the project in Vercel.
2. Add the same `NEXT_PUBLIC_*` environment variables in the Vercel project settings, including **Turnstile** keys for production (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).
3. Redeploy after changing env vars.

Ensure Supabase auth redirect URLs include your Vercel domain.

## Project layout

| Path | Role |
|------|------|
| `app/` | Routes: home, login, signup, forgot-password, dashboard, `layouts/[id]` editor, `auth/confirm`, update-password |
| `app/forgot-password/` | Request password reset (Turnstile + server action) |
| `app/auth/confirm` | Email link handler (`token_hash` → session cookies) |
| `app/auth/update-password` | Set new password after recovery link |
| `components/layout-editor/` | Canvas, palette, properties, toolbar |
| `components/dashboard/` | Dashboard grid, new layout dialog |
| `components/auth/` | Login, signup, forgot-password, update-password forms, logout |
| `lib/supabase/` | Browser + server clients, session refresh in `proxy.ts` (Edge) |
| `stores/layout-editor-store.ts` | Editor UI state |
| `types/layout.ts` | Canvas object types and layout row shape |
| `supabase/migrations/` | SQL for schema + RLS |
| `data/bcc-sample-layout.json` | Short sample JSON (subset of the in-app template) |

## Layout JSON shape

`layouts.layout_json` stores:

```json
{
  "version": 1,
  "objects": [
    {
      "id": "uuid",
      "type": "round_table",
      "x": 120,
      "y": 80,
      "width": 88,
      "height": 88,
      "rotation": 0,
      "label": "Table 1",
      "color": "#f4f1ea",
      "meta": { "seatCount": 8, "guestNames": [], "notes": "" }
    },
    {
      "id": "uuid",
      "type": "chair",
      "x": 200,
      "y": 100,
      "width": 28,
      "height": 28,
      "rotation": 0,
      "label": "",
      "color": "#c4a574",
      "meta": { "guestName": "Alex Kim" }
    }
  ]
}
```

The **sample reception** template is generated in `lib/sample-layout.ts` (`getBccSampleLayoutObjects` / `bccSampleDocument`) when you tick “Include sample…” on new layout.

## Note on `wedding_planner` vs `layouts`

This app uses a Postgres table named **`layouts`**. If you previously created a different table (e.g. from another experiment), either migrate data into `layouts` or adjust the code and policies to match your table name.

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run start` — start production server  
- `npm run lint` — ESLint  

## License

Private / personal use for the wedding project—adjust as you like.
