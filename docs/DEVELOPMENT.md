# Development notes (read this first in a new session)

## Where things run — two different servers
- **Dev VPS** (where the devcontainer runs, reached over SSH from VS Code) is **not**
  the production server. Production is another VPS (`ovhcloud-production`) managed by
  **Coolify**, whose API *is* reachable from here. URL and API token live only in the
  gitignored `.env` (`COOLIFY_URL`, `COOLIFY_TOKEN`); use them with
  `curl -H "Authorization: Bearer $COOLIFY_TOKEN" $COOLIFY_URL/api/v1/...`.
  Verify the production image locally first with `make prod-local` (→ port 3001).
- **Public repo**: never write tokens, URLs-with-credentials or `.env` contents into
  tracked files. `make hooks` enables `.githooks/pre-commit`, which blocks env files,
  token-looking strings and any secret value from `.env`.
- A server on the dev VPS is **not** `localhost` on the user's laptop. Open it through
  VS Code's **Ports** tab (forward 3000), or `ssh -L 3000:localhost:3000 ubuntu@<dev-vps>`.
  Friends cannot reach the dev VPS; real multiplayer testing happens after a deploy.

## Daily workflow
- Once per clone: `make hooks`. In the devcontainer: `make dev` (auto-reload, :3000) and `make test`.
- Git: develop only on `develop`-based branches (`feature/…`, `fix/…`, `docs/…`), merge
  back into `develop` with `--no-ff` (PRs later). `main` = releases only, merged from
  `develop` when the user says so. Small, meaningful commits; commit message ends with
  the `Co-Authored-By` line from the session reminder. Never commit `.env`.
- Don't push, merge to `main`, or deploy without being asked.

## Architecture in 30 seconds (full spec: IDEA.md)
- `app/server.mjs` boots `app/src/app.mjs` (HTTP + JSON API + static files) on
  `node:sqlite` (`app/src/db.mjs`). **Zero npm dependencies; needs Node ≥ 22.13.**
- `app/src/scenarios.mjs`: the 70 situations as data (format documented at the top) +
  `correctSpots()` (farthest from the nearest guy, dividers add distance, guys in stalls
  don't count; a free stall wins only if the best urinal is adjacent to someone; kid/dirty
  urinals are a last resort; per-scenario `correct` overrides). Add scenarios here; the
  tests check every answer is pickable.
- Languages: Spanish is the default. UI texts and jokes are in `app/public/i18n.js`
  (ES + EN). Scenario texts are English inline in `scenarios.mjs` and Spanish in
  `app/src/scenarios.es.mjs`; a test fails if a scenario lacks a translation. The game's
  `lang` column decides the language; the server sends error `code`s that the client
  translates.
- Tone: it's a party game, keep the copy cheeky. Jokes for "very wrong" picks are
  chosen by `awkward()` in `scene.js`. **Never a dick joke when the neighbour is a kid**
  (tested).
- `app/public/scene.js`: draws a scenario as SVG (urinal/low/dirty/stall/broken/sink,
  dividers, guys with poses `standing|phone|leaning|wide|hips|kid|drunk`, name tags and
  speech bubbles). `app/public/app.js`: screens
  (home, join, lobby, play, waiting, results), polling every 1.5 s.
- Auth: random token per player, header `x-token`; the organizer is the creating player.
  Answers are first-write-wins. The API must never expose `correct`/explanations or other
  players' picks before status is `revealed` (covered by `app/test/app.test.mjs`).

## Gotchas
- **docker-outside-of-docker**: inside the devcontainer, `docker run -v $PWD/…` mounts a
  path on the *host*, where the repo lives at e.g. `/home/ubuntu/workspace/urinal-test`,
  not `/workspace/app`. Avoid bind mounts from in here (`make prod-local` uses none).
- While players are answering, polling must not re-render the scene (it swallowed taps).
  `app.js` only patches the host bar in that state; keep it that way.
- `node --watch` (`make dev`) occasionally misses an edit: if the app behaves like old
  code, restart `make dev` before debugging.
- Mobile first: players are on phones. Check UI changes at ~390px wide. Text inside the
  SVG scales with the number of spots (`k` in `scene.js`) so it stays readable there.
- `node:sqlite` is experimental: the scripts pass `--disable-warning=ExperimentalWarning`.
- *Play again*: `POST /api/games/:code/again` (organizer, after reveal) creates the next
  round and stores `next_code`; clients that see `next` in the state auto-join it.
  `games.history` carries the played ids along the chain. `db.mjs` adds new columns with
  `ALTER TABLE` when missing, so old DBs keep working.
- DB lives in `DATA_DIR` (`app/data` in dev, gitignored; `/data` volume in prod). Games
  older than 48 h are purged when a new game is created.
- Real-browser check used so far: Playwright (`mcr.microsoft.com/playwright:v1.49.0-jammy`
  with `npm i playwright@1.49.0`), driving 3 browser contexts through the whole flow.
  Inside the devcontainer the app is not `localhost` for that container: run it with
  `--network container:<devcontainer-name>`.

## Status & ideas
v0 is done and works (see IDEA.md §8). Likely next steps, in the user's priority order:
iterate on gameplay/visuals with the user (v0.2: 70 situations + play again) → first release (`develop` → `main`) → Coolify
deploy (README) → timer per scenario, SSE instead of polling, ES/EN.
