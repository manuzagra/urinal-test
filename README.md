# 🚽 Urinal Test
Group party game: pick where you'd pee in different bathroom setups, then compare
with the group and the "correct" answer. Idea and plan: [IDEA.md](IDEA.md).

## Develop
1. VS Code → *Dev Containers: Reopen in Container* (creates `.env` from `.env.example`).
2. `make dev` → http://localhost:3000. Tests: `make test`.

Without VS Code: `make build && make prod-local` → http://localhost:3001.

## Deploy (Coolify)
Production runs on Coolify (server `ovhcloud-production`), project **urinal-test**,
application **urinal-test** (Docker Compose build pack, file `/compose.prod.yaml`,
branch `main`, via the Coolify GitHub App).

- **Release = push to `main`**: Coolify auto-deploys on every push to `main`.
- Public URL: http://urinario.54.37.229.58.sslip.io (temporary, no DNS needed).
  For a real domain: add a DNS `A` record pointing to the server IP, then set it on
  service `web` in Coolify **with port 3000** (e.g. `https://urinario.example.com:3000`;
  the port tells Traefik where the app listens) and redeploy.
- No environment variables are required (invite links use the URL the organizer is on).
- The SQLite database persists in the `appdata` volume. Health check: `/healthz`.
