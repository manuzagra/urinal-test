# 🚽 Urinal Test
Group party game: pick where you'd pee in different bathroom setups, then compare
with the group and the "correct" answer. Idea and plan: [IDEA.md](IDEA.md).

## Develop
1. VS Code → *Dev Containers: Reopen in Container* (creates `.env` from `.env.example`).
2. `make dev` → http://localhost:3000 (currently a placeholder page).

Without VS Code: `make build && make prod-local` → http://localhost:3001.

## Deploy (Coolify, behind your VPN)
1. Push the repo to GitHub.
2. Coolify → *New resource* → your repo → build pack **Docker Compose**,
   compose file `/compose.prod.yaml`.
3. On service `web` set the domain (e.g. `https://urinal.your-internal-domain`) and
   port `3000`.
4. Environment variables: `APP_BASE_URL` (the public URL), `ORGANIZER_SECRET`
   (long random string).
5. Deploy. The SQLite database persists in the `appdata` volume. Check `/healthz`.

Friends need access to the VPN (or expose the domain publicly) to open the link.
