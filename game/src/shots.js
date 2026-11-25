// DAPUR BARA — the staged scenes behind ?shot=kitchen|rush|assembly|serve
// and the window.__shot hook. Each scene builds a real world state with the
// same functions the game itself uses (spawned orders, a cooking station, a
// half-built plate), so every frame is what a short real game looks like and
// the same seed always gives the same frame. No screenshot is drawn by hand;
// the renderer draws them.

import { RECIPES, REGULARS } from './config.js';

function makeOrder(id, recipeId, customerIdx, patience, patienceMax) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id, recipe, customer: REGULARS[customerIdx], patience, patienceMax, born: 0 };
}

function setStation(world, kind, input, output, progress, done) {
  const st = world.stations[kind];
  st.input = input;
  st.output = output;
  st.progress = progress;
  st.done = done;
  st.burnt = false;
  st.burnLeft = 5;
}

// The cover: a busy mid-shift kitchen — three tickets, the wok steaming, a
// chopped board, a plate two-thirds built, the timer running.
export function stageKitchen(world, particles) {
  world.elapsed = 66;
  world.timeLeft = 114;
  world.coins = 86;
  world.served = 5;
  world.combo = 3;
  world.comboTimer = 12;
  world.orders = [
    makeOrder(1, 'nasi-goreng', 0, 34, 55),
    makeOrder(2, 'mie-goreng', 2, 22, 50),
    makeOrder(3, 'sate-ayam', 3, 44, 55),
  ];
  world.hand = ['kecap'];
  world.plate = ['nasi-goreng', 'telur-orak'];
  setStation(world, 'wok', 'mie', 'mie-goreng', 0.6, false);
  setStation(world, 'board', null, null, 0, false);
  world.stations.board.input = 'sayur';
  world.stations.board.output = 'sayur-potong';
  world.stations.board.progress = 0.45;
  setStation(world, 'grill', null, null, 0, false);
  for (let i = 0; i < 6; i++) particles.spawnSteam(742, 275, false);
  particles.spawnFloatText(742, 180, '', '#fff');
}

// Rush hour: four tickets, one customer nearly out of patience, both hot
// stations busy, the rush banner up.
export function stageRush(world, particles) {
  world.elapsed = 96;
  world.timeLeft = 84;
  world.coins = 142;
  world.served = 9;
  world.combo = 4;
  world.comboTimer = 15;
  world.rush = true;
  world.orders = [
    makeOrder(1, 'ayam-bakar', 1, 8, 50),
    makeOrder(2, 'nasi-goreng', 4, 30, 55),
    makeOrder(3, 'mie-goreng', 2, 40, 50),
    makeOrder(4, 'tahu-crispy', 5, 46, 50),
  ];
  world.hand = ['ayam'];
  world.plate = ['sate-matang'];
  setStation(world, 'wok', 'mie', 'mie-goreng', 0.8, false);
  setStation(world, 'grill', 'ayam-potong', 'sate-matang', 0.5, false);
  setStation(world, 'board', null, null, 0, false);
  for (let i = 0; i < 8; i++) particles.spawnSteam(742, 275, false);
  for (let i = 0; i < 4; i++) particles.spawnSteam(530, 430, false);
}

// Mid-assembly: the wok just finished, the plate holds two of three pieces,
// the board is mid-chop, the hand carries the last piece.
export function stageAssembly(world, particles) {
  world.elapsed = 40;
  world.timeLeft = 140;
  world.coins = 48;
  world.served = 3;
  world.combo = 2;
  world.comboTimer = 9;
  world.orders = [
    makeOrder(1, 'nasi-goreng', 2, 42, 55),
    makeOrder(2, 'tahu-crispy', 0, 38, 50),
  ];
  world.hand = ['kecap'];
  world.plate = ['nasi-goreng', 'telur-orak'];
  setStation(world, 'wok', 'nasi', 'nasi-goreng', 1, true);
  setStation(world, 'board', 'ayam', 'ayam-potong', 0.55, false);
  setStation(world, 'grill', null, null, 0, false);
  for (let i = 0; i < 5; i++) particles.spawnSteam(742, 275, false);
}

// The serve: a complete plate, the ticket glowing SIAP SAJI, the tip
// floating up over the pass.
export function stageServe(world, particles) {
  world.elapsed = 88;
  world.timeLeft = 92;
  world.coins = 96;
  world.served = 6;
  world.combo = 2;
  world.comboTimer = 14;
  world.orders = [
    makeOrder(1, 'sate-ayam', 3, 36, 55),
    makeOrder(2, 'mie-goreng', 1, 28, 50),
  ];
  world.hand = [];
  world.plate = ['sate-matang', 'kacang'];
  setStation(world, 'wok', 'telur', 'telur-orak', 0.35, false);
  setStation(world, 'board', null, null, 0, false);
  setStation(world, 'grill', null, null, 0, false);
  particles.spawnFloatText(934, 315, '+Rp34  TIP!', '#ffc21a');
  particles.spawnBurst(934, 290, '#58b368', 12);
  for (let i = 0; i < 4; i++) particles.spawnSteam(742, 275, false);
}

const SCENES = { kitchen: stageKitchen, rush: stageRush, assembly: stageAssembly, serve: stageServe };

export function stageShot(name, world, particles) {
  const stage = SCENES[name];
  if (!stage) return false;
  // Reset to a clean mid-game state, then let the scene fill it in.
  world.orders = [];
  world.hand = [];
  world.plate = [];
  world.over = null;
  world.rush = false;
  world.toast = '';
  world.toastTimer = 0;
  world.lost = 0;
  world.burned = 0;
  world.reputation = 3;
  stage(world, particles);
  return true;
}
