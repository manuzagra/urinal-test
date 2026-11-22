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
- Public URL: **https://pee-test.manuzagra.es** (DNS `A` record → server IP, Let's
  Encrypt certificate by Coolify). To change it, set the domain on service `web` in
  Coolify **with port 3000** (e.g. `https://pee-test.manuzagra.es:3000`; the port tells
  Traefik where the app listens) and redeploy.
- No environment variables are required (invite links use the URL the organizer is on).
- The SQLite database persists in the `appdata` volume. Health check: `/healthz`.
