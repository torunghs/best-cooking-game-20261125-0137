# BUILD NOTES — DAPUR BARA (best-cooking-game-20261125-0137)

## Concept

An Indonesian street-food warung game, built from scratch in one session on
25 Nov 2026: the player is the cook of "Dapur Bara" (Ember Kitchen), working
a 3-minute shift over a charcoal fire. The idea is deliberately local —
nasi goreng, mie goreng, sate, ayam bakar, tahu crispy, rupiah prices,
regular customers with Indonesian names — so the kitchen has a look of its
own instead of a generic diner. All art is canvas shapes drawn in code
(`game/src/food.js`, `game/src/render.js`); all sound is synthesized with
WebAudio (`game/src/audio.js`). No images, no audio files, no libraries, no
network request at run time.

## How it plays

1. An order ticket appears on the board with a dish, an ingredient
   checklist, a patience bar and a price + tip.
2. The player picks ingredients from 9 counter bins (click or keys 1–9,
   at most 2 in hand), processes them at the right station — chopping
   board 2.5 s, wok 5 s, grill 7 s — and assembles the finished pieces on
   the Piring Saji plate.
3. A finished dish left 5 s on a hot station burns and must be thrown
   away. A complete plate glows SIAP SAJI; clicking the matching ticket
   serves it for base price + patience tip, multiplied by the combo.
4. Orders arrive faster over the shift; three-piece dishes join after
   60 s; a rush hour (85–115 s) doubles the pace. Three lost customers
   end the shift early. Targets: Rp120 ★ / Rp200 ★★ / Rp300 ★★★.

## What was tested (headless Chrome 157, 25 Nov 2026)

- **Syntax:** `node --check` passes on all 11 game sources.
- **Full playtest (`playtest.mjs`, real CDP mouse clicks):** title → start,
  first order Mie Goreng arrived, mie fried in the wok (5 s), sayur
  chopped on the board (2.5 s), both plated, ticket clicked — served for
  Rp34 (Rp22 + tip), served count 1, timer counted down 167 → 164.
  Zero console errors.
- **Screenshots:** 4 staged scenes via `?shot=kitchen|rush|assembly|serve`
  (`game/src/shots.js`, each a real world state built with the game's own
  functions), captured at 1280×720 JPEG in headless Chrome, visually
  inspected twice; layout bugs found in the first pass (overlapping title,
  truncated ticket names, rush banner over station headers, missing chef
  body) were fixed and the shots retaken.
- **Entry program:** `MAKEFUN_OUTPUT_DIR=out node main.ts` writes
  `game/`, `screenshots/` and `dossier.json` (79 KB of source text, under
  the 160 KiB cap); run twice, the outputs are byte-identical.
- **Limits:** 4 screenshots, 105–121 KB each (cap 256 KiB), 1280×720
  (long side ≤ 1280, short side ≥ 480); `game/` is 11 files, ~78 KB
  (caps 993 files / 48 MiB); no file under `game/` references anything
  outside `game/` and no network call exists in the game.

## Deliverables

- `main.ts` (Node 22, stdlib only) — copies `game/` + `screenshots/` and
  writes `dossier.json` via `vendor/makefun-game.ts` (kit copy, unchanged,
  sha256 `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`)
- `game/` — `index.html` + 11 ES modules under `game/src/`
- `screenshots/` — `1-kitchen.jpg` (cover: full kitchen mid-shift),
  `2-rush.jpg` (rush hour, 4 tickets, one patience nearly out),
  `3-assembly.jpg` (wok done, plate two-thirds built, board mid-chop),
  `4-serve.jpg` (complete plate, SIAP SAJI ticket, +Rp34 tip)
- `LICENSE` (MIT, from the kit starter)
