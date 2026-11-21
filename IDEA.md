# Urinal Test — idea & plan

## 1. What it is
A party game for groups. A **host** creates a game and shares a link. Everybody
joins from their phone, and for each **scenario** (a bathroom with urinals/stalls
and some guys already peeing in various positions) picks **where they would pee**.
When the host says so, everyone sees the results: where each person chose, where
the **"correct"** spot is, and where **most of the group** went.

Goal: functional and fun with friends. Not perfect.

## 2. Roles & flow
1. **Host** opens `/`, clicks *New game*, picks a scenario set (default: all) and
   gets a lobby with a **join link** (+ short code, e.g. `K7QF`) to share.
2. **Players** open the link, type a nickname, appear in the lobby (no accounts;
   identity = random token in `localStorage`, so a refresh keeps you in).
3. Host clicks *Start*. Every player sees the same scenario and taps a spot.
   Players can answer at their own pace through the list of scenarios
   (simplest, no per-round sync) — host sees how many have finished.
4. Host clicks *Reveal results*. Everybody (live) sees, per scenario:
   - their own pick
   - the **correct** spot (highlighted)
   - a **heatmap / vote count** per spot (who picked it, % of group)
   - overall score (how many matched the correct answer)
5. Host can *Close* the game. Games auto-expire after ~24h.

Answers are locked once submitted. Results are hidden from players (the API must
not leak other answers or the correct spot) until the host reveals.

## 3. Scenarios
A scenario is **data, rendered as SVG** — no image assets needed.

```jsonc
{
  "id": "three-one-occupied-left",
  "title": "Three urinals, one taken",
  "layout": "row",                 // row | row-with-stalls | divided ...
  "spots": [                        // pickable positions, left to right
    { "id": "u1", "kind": "urinal" },
    { "id": "u2", "kind": "urinal" },
    { "id": "u3", "kind": "urinal" }
  ],
  "occupied": [ { "spot": "u1", "pose": "standing" } ],   // pose: standing | leaning | phone | ...
  "correct": ["u3"],                // one or several accepted answers
  "explanation": "Keep max distance; u3 leaves a gap."
}
```
Scenarios live in a JSON/TS file in the repo (`app/src/scenarios.mjs`), edited by
hand. "Correct" = the accepted etiquette answer (maximise distance, avoid
adjacent, etc.) written by us per scenario. Start with ~10–15 scenarios.

## 4. Stack (kept deliberately small)
- **Plain Node 22 server + vanilla JS/SVG frontend, zero npm dependencies**, single
  container, mobile-first UI (no build step; chosen over Next.js to keep deploys trivial).
- **SQLite** via Node's built-in `node:sqlite` in `DATA_DIR` (`/data` volume in prod).
  One host, a few dozen players: no Postgres/Redis needed.
- **Live updates by polling** (every ~2s) of a `GET /api/games/:code` state
  endpoint. Simple and robust behind Coolify/Traefik; upgrade to SSE later if wanted.
- No user accounts. Identity is a random token per player in `localStorage` (sent as
  `x-token`); the organizer is the player who created the game.

## 5. Data model
- `games(code PK, host_token, status[lobby|playing|revealed|closed], scenario_ids json, created_at)`
- `players(id PK, game_code, nickname, token, joined_at)`
- `answers(game_code, player_id, scenario_id, spot_id, answered_at, PK(game_code, player_id, scenario_id))`

## 6. API sketch
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/games` | anyone | creates game → `{code, hostToken}` |
| POST | `/api/games/:code/join` | anyone | `{nickname}` → `{playerId, token}` |
| GET | `/api/games/:code` | all | status, players, scenarios (no `correct`), my answers, progress counts; after reveal also all results + correct |
| POST | `/api/games/:code/answers` | player | `{scenarioId, spotId}` (idempotent, locked) |
| POST | `/api/games/:code/start` | host | lobby → playing |
| POST | `/api/games/:code/reveal` | host | playing → revealed |

## 7. Pages
`/` (create/join by code) · `/g/[code]` (lobby → play → results, one page
driven by `status`) · `/g/[code]/host` controls shown only to the host.

## 8. Status
v0 implemented: lobby with invite link/code, play flow, organizer start/reveal, results
(correct spot, votes per spot, who picked what, scoreboard). The organizer also plays.
Answers are locked once given; the server withholds the correct answers and everybody's
picks until the organizer reveals.

v0.2: 70 situations (dividers, sinks, kid-height and dirty urinals, occupied stalls, name
tags, speech bubbles, context lines; several accept more than one answer). The organizer
picks 5/10/15/20 random situations; ones this browser already played come last.
*Play again* after the reveal starts a new round for the same group (everyone is moved
automatically) with situations not yet played in that chain.

v0.3: mobile-first pass (scene text scales with the number of spots, ≥44px tap targets,
safe areas). Results have a player picker: tap anybody to see their pick drawn on every
scene and whether they got it right. The organizer picks 3–30 situations for every round,
including *Play again*.

v0.4: Spanish (Spain) by default, English optional: the organizer picks the game's
language and everyone in that game sees it (UI, situations, errors). Results got fun:
cheeky jokes when a pick is wrong *and* right next to a guy ("¡te he visto el pito!",
size jokes, a special one for sandwiches; next to a kid only a telling-off, never a dick
joke), praise for good picks, 👀 on the neighbour in the drawing, and awards (urinal
master, flasher of the day).

Next ideas: timer per scenario, SSE instead of polling, scenario
editor, i18n (ES/EN).
