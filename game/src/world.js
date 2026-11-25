// DAPUR BARA — the world: orders, stations, the plate, the hand, coins,
// combo and reputation. No drawing here (render.js paints this state) and
// no input here (main.js translates clicks into these calls). Every rule
// the recipe book promises lives in this file.

import {
  BINS, BURN_SECONDS, HAND_MAX, MAX_REPUTATION, RECIPES, REGULARS,
  SHIFT_SECONDS, STATIONS, TARGET_COINS,
} from './config.js';
import { pick } from './random.js';

let orderId = 0;

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function createWorld(random) {
  return {
    random,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    burned: 0,
    reputation: MAX_REPUTATION,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    hand: [],
    plate: [],
    orders: [],
    stations: {
      board: { input: null, output: null, progress: 0, done: false, burnt: false, burnLeft: 0 },
      wok: { input: null, output: null, progress: 0, done: false, burnt: false, burnLeft: 0 },
      grill: { input: null, output: null, progress: 0, done: false, burnt: false, burnLeft: 0 },
    },
    spawnIn: 1.2,
    rush: false,
    rushAnnounced: false,
    toast: '',
    toastTimer: 0,
    over: null,
    sizzleOn: false,
  };
}

export function startShift(world) {
  const fresh = createWorld(world.random);
  Object.assign(world, fresh);
  world.toast = 'Shift dimulai! Layani pelanggan sebelum sabar mereka habis.';
  world.toastTimer = 3;
}

function availableRecipes(world) {
  // The first minute stays gentle: two-piece dishes only. After that the
  // three-piece dishes join the board and the pace picks up.
  if (world.elapsed < 60) return RECIPES.filter((r) => r.components.length === 2);
  return RECIPES;
}

export function spawnOrder(world) {
  const recipe = pick(world.random, availableRecipes(world));
  const customer = pick(world.random, REGULARS);
  const patienceMax = 55 - Math.min(15, world.elapsed / 12);
  world.orders.push({
    id: ++orderId,
    recipe,
    customer,
    patience: patienceMax,
    patienceMax,
    born: world.elapsed,
  });
}

function setToast(world, text) {
  world.toast = text;
  world.toastTimer = 2.6;
}

// --- The hand and the bins -------------------------------------------------

export function pickBin(world, binId) {
  if (world.over) return;
  const bin = BINS.find((b) => b.id === binId);
  if (!bin) return;
  if (world.hand.length >= HAND_MAX) { setToast(world, 'Tangan penuh! Sajikan atau buang dulu.'); return 'full'; }
  world.hand.push(binId);
  return 'ok';
}

export function trashHand(world) {
  if (world.hand.length === 0) {
    if (world.plate.length > 0) {
      world.plate = [];
      setToast(world, 'Piring dikosongkan.');
      return 'plate-cleared';
    }
    return null;
  }
  world.hand.pop();
  return 'trashed';
}

// --- Stations ---------------------------------------------------------------

function stationOf(world, kind) {
  return world.stations[kind];
}

export function stationAccepts(kind, item) {
  return Object.prototype.hasOwnProperty.call(STATIONS[kind].turns, item);
}

export function clickStation(world, kind) {
  if (world.over) return null;
  const st = stationOf(world, kind);
  const def = STATIONS[kind];
  if (st.burnt) {
    st.input = null; st.output = null; st.burnt = false; st.progress = 0;
    setToast(world, 'Makanan gosong dibuang. Hati-hati waktunya!');
    return 'cleared-burnt';
  }
  if (st.done) {
    if (world.hand.length >= HAND_MAX) { setToast(world, 'Tangan penuh! Kosongkan dulu.'); return 'full'; }
    world.hand.push(st.output);
    st.input = null; st.output = null; st.done = false; st.progress = 0;
    return 'collected';
  }
  if (st.input) return 'busy';
  const item = world.hand[world.hand.length - 1];
  if (!item) { setToast(world, `${def.name}: ambil bahan dulu dari counter.`); return 'empty-hand'; }
  if (!stationAccepts(kind, item)) {
    setToast(world, `${def.name} tidak bisa mengolah ${item}. Cek buku resep (R).`);
    return 'wrong';
  }
  world.hand.pop();
  st.input = item;
  st.output = def.turns[item];
  st.progress = 0;
  return 'started';
}

// --- The plate ---------------------------------------------------------------

export function clickPlate(world) {
  if (world.over) return null;
  const item = world.hand[world.hand.length - 1];
  if (!item) { setToast(world, 'Piring kosong — taruh bahan matang di sini.'); return 'empty-hand'; }
  world.hand.pop();
  world.plate.push(item);
  return 'plated';
}

export function plateMatches(world, recipe) {
  if (world.plate.length !== recipe.components.length) return false;
  const have = [...world.plate].sort();
  const need = [...recipe.components].sort();
  return have.every((v, i) => v === need[i]);
}

export function plateReadyRecipe(world) {
  for (const order of world.orders) {
    if (plateMatches(world, order.recipe)) return order;
  }
  return null;
}

export function serveOrder(world, order) {
  if (world.over || !order) return null;
  if (!plateMatches(world, order.recipe)) {
    setToast(world, 'Piring belum cocok dengan pesanan ini.');
    return 'mismatch';
  }
  const patienceRatio = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(15 * patienceRatio);
  world.combo = world.comboTimer > 0 ? world.combo + 1 : 1;
  world.comboTimer = 20;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const mult = 1 + 0.1 * (world.combo - 1);
  const pay = Math.round((order.recipe.price + tip) * mult);
  world.coins += pay;
  world.served += 1;
  world.plate = [];
  world.orders = world.orders.filter((o) => o.id !== order.id);
  return { pay, tip, combo: world.combo, customer: order.customer.name };
}

// --- The tick -----------------------------------------------------------------

export function updateWorld(world, dt, audio, particles) {
  if (world.over) return;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (world.toastTimer > 0) world.toastTimer -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Rush hour: minutes 1:25-1:55, orders come twice as fast.
  world.rush = world.elapsed >= 85 && world.elapsed < 115;
  if (world.rush && !world.rushAnnounced) {
    world.rushAnnounced = true;
    setToast(world, 'JAM RAMAI! Pelanggan berdatangan!');
    audio.angry();
  }

  // New orders.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < 4) {
    spawnOrder(world);
    const base = world.rush ? 6.5 : Math.max(8, 13 - world.elapsed / 25);
    world.spawnIn = base + world.random() * 3;
  }

  // Patience runs out: the customer walks away angry.
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.lost += 1;
      world.reputation -= 1;
      world.combo = 0;
      world.comboTimer = 0;
      setToast(world, `${order.customer.name} pergi kecewa — ${order.recipe.name} tak kunjung datang.`);
      audio.angry();
      if (world.reputation <= 0) {
        endShift(world, false, audio);
        return;
      }
    }
  }

  // Stations cook, then burn if forgotten.
  let anyCooking = false;
  for (const kind of Object.keys(world.stations)) {
    const st = world.stations[kind];
    if (st.input && !st.done) {
      anyCooking = true;
      st.progress += dt / STATIONS[kind].seconds;
      if (st.progress >= 1) {
        st.progress = 1;
        st.done = true;
        st.burnLeft = BURN_SECONDS;
        audio.done();
      }
    } else if (st.done && !st.burnt) {
      st.burnLeft -= dt;
      if (st.burnLeft <= 0) {
        st.burnt = true;
        world.burned += 1;
        setToast(world, `${STATIONS[kind].name}: gosong! Klik untuk membuang.`);
        audio.burn();
      }
    }
  }
  if (audio.setSizzle) audio.setSizzle(anyCooking && !world.over);

  // Steam and sparks from the hot stations (centres match render.js).
  if (world.stations.wok.input) particles.spawnSteam(742, 275, world.stations.wok.burnt);
  if (world.stations.grill.input) particles.spawnSteam(530, 430, world.stations.grill.burnt);
  if (world.random() < dt * 6) particles.spawnSpark(700 + world.random() * 90, 330);

  // The shift ends.
  if (world.timeLeft <= 0) endShift(world, true, audio);
}

function endShift(world, finished, audio) {
  const stars = world.coins >= TARGET_COINS.three ? 3
    : world.coins >= TARGET_COINS.two ? 2
    : world.coins >= TARGET_COINS.one ? 1 : 0;
  world.over = {
    won: finished && stars > 0,
    finished,
    stars,
    coins: world.coins,
    served: world.served,
    lost: world.lost,
    bestCombo: world.bestCombo,
  };
  if (audio.setSizzle) audio.setSizzle(false);
  if (world.over.won) audio.win();
  else audio.lose();
}
