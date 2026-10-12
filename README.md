# PickMyTravels

PickMyTravels is a React/Vite booking site. Its public pages are deployed to GitHub Pages. Bookings, fleet records, enquiries, offers, and administrator access are stored in a **Google Spreadsheet** through a bound Google Apps Script web app (`google-apps-script/Code.gs`). The Supabase Edge Function + Postgres stack remains in the repo as a fallback driver.

## Google Sheets database setup

1. Create a new Google Spreadsheet — it becomes the database, with one tab per collection (Cars, Blogs, Settings, Bookings, Enquiries, Feedback).
2. In the sheet, open **Extensions > Apps Script**, delete the default code, and paste `google-apps-script/Code.gs`.
3. **Project Settings > Script Properties** — add:
   - `SESSION_SECRET` — long random string used to sign admin session tokens
   - `INITIAL_ADMIN_USERNAME` — admin login id (used only to create the login on first run)
   - `INITIAL_ADMIN_PASSWORD` — admin password (used only to create the login on first run)
4. **Deploy > New deployment > Web app**: Execute as = Me, Access = Anyone. Copy the web app URL (ends in `/exec`).
5. Set `VITE_SHEETS_API_URL` to that URL in `.env.local` (local dev) and in a GitHub secret of the same name (Pages builds).

The API accepts public vehicle/blog/offer reads and booking/enquiry/feedback submissions. Admin login and all administrative data changes require a signed, expiring session token verified by the script. Records are stored one per row: readable flattened columns plus a `data_json` column holding the full record.

The default admin User ID comes from `INITIAL_ADMIN_USERNAME`. Change the password from the Admin Panel after signing in. Never commit `.env.local` or `.neon`.

## Switching back to Supabase/Postgres

Set `ACTIVE_DB_DRIVER: "POSTGRES"` in `src/config/app.config.js`; the app then uses `VITE_API_BASE_URL` as before.

## Local development

1. Install dependencies with `npm ci`.
2. Keep the ignored `.env.local` file containing local API settings and generated admin/session secrets.
3. Start the frontend with `npm run dev`.

To exercise the Google Sheets driver without deploying, run `node scripts/sheets-dev-mock.mjs` (a local stand-in for the Apps Script web app, login `admin` / `demo-password-123`) and set `VITE_SHEETS_API_URL=http://localhost:8787` in `.env.local`.

## Deployments

- `supabase functions deploy picktravel` deploys the Postgres API in `supabase/functions/picktravel` (only used when `ACTIVE_DB_DRIVER` is `POSTGRES`).
- Configure `SESSION_SECRET` as a Supabase Edge Function secret. The function uses the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values.
- GitHub Actions can manually build and publish the frontend to GitHub Pages. Automatic deployment on every push is disabled while hosting is paused. The `VITE_SHEETS_API_URL` secret must be set for the default Sheets driver.
- `.env.local`, `.neon`, `supabase/.env`, and build output are excluded from Git.
