# RRLoyalty

## Supabase setup

The app uses a hosted Supabase project. You can also run Supabase on your own machine to try database changes safely.

### Connect to the hosted project

1. Ask the team to invite you to the RRLoyalty organization in Supabase.
2. Copy `.env.example` to `.env.local`.
3. In the Supabase dashboard, open the project and click **Connect**. Copy the project URL and the publishable key (`sb_publishable_...`) into `.env.local`.
4. Run `npm install` and `npm run dev`, then open http://localhost:3000/supabase. It should say "Ühendus Supabasega töötab."

Only use the publishable key. Never put the secret or `service_role` key in `.env.local`, the code, or a commit.

### Run Supabase locally

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

1. `npx supabase start` starts the local server. The first run downloads it and takes a few minutes.
2. `npx supabase status` shows the local API URL and publishable key. Put those into `.env.local` instead of the hosted values. The local server does not check API keys, so `/supabase` only confirms the URL there. Use the hosted project to confirm your key.
3. `npx supabase stop` stops the server when you are done.

Switch `.env.local` back to the hosted values when you are finished testing locally.
