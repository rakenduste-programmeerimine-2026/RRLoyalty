# RRLoyalty: Gustavi rada

A prototype of **Gustavi rada**, a loyalty program for Rahva Raamat customers, built for the Rakenduste programmeerimine course in 2026. Deadline: 19 November 2026.

## Team

| Name | GitHub | Area |
| --- | --- | --- |
| Martin Saareväli | [@Shargathx](https://github.com/Shargathx) | Frontend |
| Anette Aruorg | [@aruorg](https://github.com/aruorg) | Database |
| Roland Piperal | [@piperal](https://github.com/piperal) | Backend |

## What the app is trying to achieve

Rahva Raamat customers buy in shops, in the e-shop, at Literaat and in the app. Gustavi rada turns all of those purchases into one visible journey: every euro moves Gustav the cat along a rail, and each stop on the way opens a reward. The goal is to give members a reason to come back, whichever channel they use, and to make the program easy to understand at a glance.

The prototype simulates the sales channels, payments and emails, so the whole program can be shown end to end without real integrations.

## Core features

The agreed rules are in [`docs/program-rules.md`](docs/program-rules.md). When this README and the rules disagree, the rules win.

- **Points from every channel:** 1 point per euro paid, rounded down per purchase, from the shops, the e-shop, Literaat and the app.
- **The rail:** 8 stops from 50 to 400 points, each opening a perk: a hot drink, 5 € gift card or donation choices, app perks, double points and a free parcel locker.
- **Laps and expiry:** reaching 400 starts a new lap with the extra points carried over. Points expire 6 months after the last purchase. Perks, completed laps and the lifetime total are kept.
- **Prize choice:** at 100, 200, 300 and 400 the member has 3 days to choose a 5 € gift card or a 5 € donation to a school library; with no choice, they get the gift card. Gift cards are shown with a scannable QR code.
- **Name-day discount:** −10% on books by authors who share the member's first name, on the member's name day only.
- **Birthday reward:** a 5 € card once a year.
- **Postkast:** program messages in the app instead of real emails.
- **Member account:** sign-in, the Gustavi rada page with points, perks, history and the expiry date, a cart and a simulated checkout.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router, Cache Components) with React 19 and TypeScript
- [Supabase](https://supabase.com/): Postgres, Auth (email and password) and row-level security
- [Vercel](https://vercel.com/) for hosting; `development` deploys to production
- GitHub Actions for lint, type check, tests and build on every PR
- [Vitest](https://vitest.dev/) for the points rules and other domain logic; pgTAP for the database policies; Playwright for the main flows (planned)
- [`qrcode`](https://www.npmjs.com/package/qrcode) for the gift card QR codes

## Success criteria

<!-- To be agreed by the team. -->

-

## Supabase setup

The app uses a hosted Supabase project. You can also run Supabase on your own machine to try database changes safely.

### Connect to the hosted project

1. Ask the team to invite you to the RRLoyalty organization in Supabase.
2. Copy `.env.example` to `.env.local`.
3. In the Supabase dashboard, open the project and click **Connect**. Copy the project URL and the publishable key (`sb_publishable_...`) into `.env.local`.
4. Run `npm install` and `npm run dev`, then open http://localhost:3000/supabase. It should say "Ühendus Supabasega töötab."

The secret key (`SUPABASE_SECRET_KEY`) is only for server code and the seed script. Keep it in `.env.local`, never give it a `NEXT_PUBLIC_` prefix, and never put it in the code or a commit.

### Run Supabase locally

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

1. `npx supabase start` starts the local server. The first run downloads it and takes a few minutes.
2. `npx supabase status` shows the local API URL and publishable key. Put those into `.env.local` instead of the hosted values. The local server does not check API keys, so `/supabase` only confirms the URL there. Use the hosted project to confirm your key.
3. `npx supabase stop` stops the server when you are done.

Switch `.env.local` back to the hosted values when you are finished testing locally.

## Seed data

`npm run seed` fills the database that `.env.local` points to with the demo data: settings, the 8 rail stops, the namesake books, Mari's name day (19 November, the presentation day) and the demo member Mari Maasikas on 34 points, with her sign-in account.

It needs `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DEMO_EMAIL` and `DEMO_PASSWORD` in `.env.local`. The demo password is shared within the team privately, never in the repo. Running the seed again is safe: it updates rows instead of duplicating them and never deletes anything.

For a fresh local database: `npx supabase db reset`, then `npm run seed` with `.env.local` pointing at the local server.

**Temporary:** the name-day discount only applies on the name day itself, so `npm run seed:demo-name-days` gives Mari a name day on every date to test it on any day. Remove the script, and every Mari name day except 19 November, once `/demo` (#22) can move "today".

## Database tests

`npm run test:db` runs the SQL tests in `supabase/tests/` against the local Supabase server, so Docker and `npx supabase start` are needed. `rls.test.sql` checks the row-level security policies: a member reads only their own data, a visitor reads only the public program and shop data, and nobody but the server can change anything. The tests roll back, so they leave the database as it was.

GitHub Actions does not run these tests, so run them before opening a PR that changes the database.
