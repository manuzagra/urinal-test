# Urinal Test
Party game; read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) first (workflow, the dev-VPS vs production-VPS split, gotchas), then [IDEA.md](IDEA.md) (the spec).
- Stack: plain Node 22 (no deps, `node:sqlite`) + vanilla JS/SVG frontend in `app/public`, one container. Keep it simple; "functional, not perfect".
- Dev: devcontainer (`.devcontainer/`), compose service `workspace`, app in `app/`, port 3000.
- Prod: `compose.prod.yaml` on Coolify (builds Dockerfile `runtime` stage, data in `/data` volume).
- Never commit `.env`. Players must not be able to see the correct answer or others' answers before the host reveals.
- Git: `main` = releases only. Branch every change off `develop` (`feature/...`, `fix/...`), then merge back into `develop` with `--no-ff` (PRs later). Small, meaningful commits.
