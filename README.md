# DAPUR BARA — Ember Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/torunghs/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/torunghs/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game for the make.fun **best-cooking-game-20261125-0137** bounty ($250). Vanilla canvas, no libraries, no network: every script, sound and pixel is generated in code.

## The game

You run a street-food stall — a warung — over a charcoal fire. A 3-minute shift. Customers arrive with order tickets on the board; each ticket shows the dish, its ingredients as a checklist, a patience bar and the price plus tip.

- **Cook for real:** 9 ingredient bins (rice, noodles, egg, chicken, veg, tofu, soy, chilli, peanut sauce), 3 stations with timed work — chopping board (2.5 s), wok (5 s), grill (7 s) — and a plating station where dishes are assembled piece by piece.
- **5 recipes:** Nasi Goreng Bara, Mie Goreng, Sate Ayam Bara, Ayam Bakar, Tahu Crispy. Each is a different route through the kitchen: chop first, or straight to the grill; sauce on the plate, or in the wok.
- **Pressure that grows:** orders arrive faster, three-piece dishes join after the first minute, and a rush hour doubles the pace. Leave a finished dish on a hot station for 5 seconds and it burns.
- **Score:** base price + a patience tip, multiplied by a combo for consecutive serves. Targets: Rp120 ★, Rp200 ★★, Rp300 ★★★. Lose all 3 reputation hearts and the shift ends early.
- **Feel:** steam and ember sparks, a sizzle loop while food cooks, chop thocks, a serve jingle, a burn alarm — all synthesized with WebAudio. A recipe book (R) lists every dish and its route.

## Play

- **Goal:** earn as much as you can in 3 minutes; Rp120 for one star.
- **Controls:** click a bin (or press 1–9) to pick up an ingredient, click a station to use it, click the station again to collect the result, click Piring Saji to plate it, click the matching order ticket (or press Space) to serve. T / Backspace throws away what's in hand (or clears the plate). P pauses, M mutes, R opens the recipe book, Enter starts.
- **Hands:** you carry at most 2 items — plan the route, don't just grab.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

Open `game/index.html` in desktop Chrome. No build step, no network request.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

- `main.ts` — the entry program (Node 22, stdlib only)
- `serve.ts` — a tiny static server for local play
- `vendor/makefun-game.ts` — the kit's library, unchanged
- `game/index.html` — the page
- `game/src/config.js` — constants, bins, stations, recipes
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/input.js` — mouse + keyboard
- `game/src/world.js` — orders, stations, plate, coins, combo, reputation
- `game/src/food.js` — every ingredient and dish drawn in code
- `game/src/render.js` — the kitchen, order board, HUD, overlays
- `game/src/particles.js` — steam, sparks, floating scores
- `game/src/shots.js` — the staged screenshot scenes
- `game/src/main.js` — boot, the loop, screens
- `screenshots/` — 4 real renders of the game's own code
- `shot.mjs`, `playtest.mjs` — the headless-Chrome screenshot and playtest drivers used during development
