# PickMyTravels

PickMyTravels is a React/Vite booking site. Its public pages are deployed to GitHub Pages, while bookings, fleet records, enquiries, offers, and administrator access use a protected API deployed as a Neon Function next to the Neon Postgres database.

## Local development

1. Install dependencies with `npm ci`.
2. Keep the ignored `.env.local` file containing the Neon environment values and generated admin/session secrets.
3. Start the frontend with `npm run dev`.

The default admin User ID is `admin`. The initial password is configured locally in `.env.local` as `INITIAL_ADMIN_PASSWORD` and is only used when the database is initialized for the first time. Change it from the Admin Panel after signing in. Never commit `.env.local` or `.neon`.

## Deployments

- `neon deploy --env .env.local` deploys the API declared in `neon.ts` to the linked Neon branch.
- GitHub Actions builds and publishes the frontend from `main` to GitHub Pages. Configure the repository Actions variable `VITE_API_BASE_URL` with the public Neon Function base URL.
- `.env.local`, `.neon`, and build output are excluded from Git.

The Neon API accepts public vehicle/blog/offer reads and booking/enquiry submissions. Admin login and all administrative data changes require a signed, expiring session token.
