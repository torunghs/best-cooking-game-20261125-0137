// DAPUR BARA — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between four
// screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=kitchen|rush|assembly|serve (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createInput, ACTION_BOOK, ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH } from './input.js';
import { createParticles } from './particles.js';
import { createWorld, clickPlate, clickStation, pickBin, plateReadyRecipe, serveOrder, startShift, trashHand, updateWorld } from './world.js';
import { createRenderer, hitAt, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, START_BUTTON } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const particles = createParticles(random);
const audio = createAudio();
const renderer = createRenderer(canvas);
const input = createInput(canvas, (nx, ny) => ({ x: nx * 1280, y: ny * 720 }));

let screen = SCREEN_TITLE;
let bookOpen = false;
let best = 0;
try { best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { best = 0; }

function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage can be off */ }
}

function announce(text) {
  status.textContent = text;
}

function startGame() {
  audio.unlock();
  startShift(world);
  screen = SCREEN_PLAY;
  bookOpen = false;
  announce('Shift dimulai. Layani pelanggan!');
}

function tryServe(order) {
  const ready = plateReadyRecipe(world);
  if (!ready) {
    world.toast = 'Piring belum lengkap — rakit dulu di Piring Saji.';
    world.toastTimer = 2.6;
    return;
  }
  if (order && ready.id !== order.id) {
    world.toast = `Piring ini untuk ${ready.customer.name} (${ready.recipe.name}).`;
    world.toastTimer = 2.6;
    return;
  }
  const result = serveOrder(world, ready);
  if (result) {
    audio.serve();
    particles.spawnFloatText(934, 315, `+Rp${result.pay}`, '#ffc21a');
    particles.spawnBurst(934, 290, '#58b368', 14);
    announce(`Tersaji untuk ${result.customer}: Rp${result.pay}.`);
  }
}

function handleClick(click) {
  audio.unlock();
  if (bookOpen) { bookOpen = false; return; }
  if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
    if (click.x >= START_BUTTON.x && click.x <= START_BUTTON.x + START_BUTTON.w
      && click.y >= START_BUTTON.y && click.y <= START_BUTTON.y + START_BUTTON.h) {
      startGame();
    }
    return;
  }
  const hit = hitAt(world, click.x, click.y);
  if (!hit) return;
  if (hit.type === 'pause') {
    screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
    return;
  }
  if (hit.type === 'mute') { audio.toggleMute(); return; }
  if (hit.type === 'book') { bookOpen = true; return; }
  if (screen !== SCREEN_PLAY) return;
  if (hit.type === 'bin') {
    if (pickBin(world, hit.id) === 'ok') audio.pickup();
  } else if (hit.type === 'station') {
    const result = clickStation(world, hit.kind);
    if (result === 'started') audio.startCook();
    else if (result === 'collected') audio.pickup();
    else if (result === 'cleared-burnt') audio.drop();
  } else if (hit.type === 'plate') {
    if (clickPlate(world) === 'plated') audio.drop();
  } else if (hit.type === 'trash') {
    if (trashHand(world)) audio.drop();
  } else if (hit.type === 'ticket') {
    tryServe(hit.order);
  }
}

function handleKey(key) {
  if (key === ACTION_CONFIRM) {
    audio.unlock();
    if (bookOpen) { bookOpen = false; return; }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    return;
  }
  if (key === ACTION_PAUSE) {
    if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    return;
  }
  if (key === ACTION_MUTE) { audio.toggleMute(); return; }
  if (key === ACTION_BOOK) {
    if (screen === SCREEN_PLAY || bookOpen) bookOpen = !bookOpen;
    return;
  }
  if (screen !== SCREEN_PLAY) return;
  if (key === ACTION_TRASH) {
    if (trashHand(world)) audio.drop();
    return;
  }
  if (key === ACTION_SERVE) { tryServe(null); return; }
  if (key >= '1' && key <= '9') {
    const bins = ['nasi', 'mie', 'telur', 'ayam', 'sayur', 'tahu', 'kecap', 'sambal', 'kacang'];
    const id = bins[Number(key) - 1];
    if (id && pickBin(world, id) === 'ok') audio.pickup();
  }
}

function stage(name) {
  if (!stageShot(name, world, particles)) return;
  renderer.draw(world, SCREEN_PLAY, { best, muted: audio.muted, bookOpen: false }, particles);
  renderer.draw(world, SCREEN_PLAY, { best, muted: audio.muted, bookOpen: false }, particles);
  window.__shotReady = true;
}

window.__shot = stage;
window.__world = world;
window.__screen = () => screen;

if (shot) {
  // Staged screenshot mode: one scene, one frame, no loop, no audio.
  renderer.resize();
  stage(shot);
} else {
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    for (const click of input.takeClicks()) handleClick(click);
    for (const key of input.takeKeys()) handleKey(key);
    if (screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        updateWorld(world, STEP, audio, particles);
        acc -= STEP;
        if (world.over) {
          screen = SCREEN_OVER;
          if (world.coins > best) { best = world.coins; saveBest(best); }
          break;
        }
      }
      particles.update(dt);
    } else {
      // Idle life behind the panels: steam still curls.
      particles.update(dt);
      if (world.random() < dt * 2) particles.spawnSteam(742, 275, false);
    }
    renderer.draw(world, screen, { best, muted: audio.muted, bookOpen }, particles);
  }
  requestAnimationFrame(frame);
}
