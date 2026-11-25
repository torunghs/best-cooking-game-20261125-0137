// Playtest driver for DAPUR BARA: starts a real game in headless Chrome,
// plays one full order end-to-end with real mouse clicks (bin -> station ->
// collect -> plate -> serve), and reports the outcome plus console errors.
const [url] = process.argv.slice(2);
const port = process.env.CDP_PORT || '9226';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const errors = [];
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
  else if (data.method === 'Runtime.exceptionThrown') {
    errors.push(JSON.stringify(data.params.exceptionDetails).slice(0, 500));
  } else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
    errors.push(JSON.stringify(data.params.args).slice(0, 500));
  }
};
function send(method, params = {}) {
  const mid = ++id;
  return new Promise((resolve) => { pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })); });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) errors.push(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
  return r.result?.result?.value;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function click(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(120);
}
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2500);

// Title screen visible?
console.log('screen at load:', await evalJs('window.__screen()'));
// Start the game.
await click(640, 552);
await sleep(500);
console.log('screen after start:', await evalJs('window.__screen()'));

// Wait for the first order.
let order = null;
for (let i = 0; i < 30; i++) {
  order = await evalJs('window.__world.orders[0] ? {recipe: window.__world.orders[0].recipe.id, components: window.__world.orders[0].recipe.components, patience: Math.round(window.__world.orders[0].patience)} : null');
  if (order) break;
  await sleep(500);
}
console.log('first order:', JSON.stringify(order));
if (!order) { console.log('PLAYTEST FAIL: no order arrived'); process.exit(1); }

// Layout mirrors render.js.
const BIN_POS = { nasi: [52, 259], mie: [132, 259], telur: [212, 259], ayam: [292, 259], sayur: [372, 259], tahu: [52, 331], kecap: [132, 331], sambal: [212, 331], kacang: [292, 331] };
const ST_POS = { board: [530, 279], wok: [742, 279], grill: [530, 437] };
const PLATE_POS = [742, 437];
const TRANSFORMS = { // raw item -> [station, cooked item]
  ayam: ['board', 'ayam-potong'], sayur: ['board', 'sayur-potong'],
  nasi: ['wok', 'nasi-goreng'], mie: ['wok', 'mie-goreng'], telur: ['wok', 'telur-orak'], tahu: ['wok', 'tahu-crispy'],
  'ayam-potong': ['grill', 'sate-matang'], ayam2: ['grill', 'ayam-bakar'],
};
const PLATE_RAW = new Set(['kecap', 'sambal', 'kacang']);
const COOK_SECS = { board: 3, wok: 6, grill: 8 };

// Build each component: raw items that need a station go through it;
// raw plate items (kecap/sambal/kacang) go straight to the plate.
// Note: ayam-bakar needs raw ayam on the grill; sate needs chopped ayam.
const cooked = {};
for (const comp of order.components) {
  if (PLATE_RAW.has(comp)) {
    await click(...BIN_POS[comp]);
    await click(...PLATE_POS);
    console.log(`plated raw ${comp}`);
    continue;
  }
  // Find the raw item + station producing this component.
  if (comp === 'ayam-bakar') {
    await click(...BIN_POS.ayam);
    await click(...ST_POS.grill);
    await sleep(COOK_SECS.grill * 1000 + 400);
    await click(...ST_POS.grill);
    console.log('grilled ayam -> ayam-bakar');
    await click(...PLATE_POS);
    console.log(`plated ${comp}`);
    continue;
  }
  let raw = null, station = null;
  for (const [r, [st, out]] of Object.entries(TRANSFORMS)) {
    if (out === comp) { raw = r; station = st; break; }
  }
  if (!raw) { console.log('PLAYTEST FAIL: no path to', comp); process.exit(1); }
  if (raw === 'ayam-potong' || raw === 'sayur-potong') {
    // Chop first: raw base is ayam/sayur.
    const base = raw === 'ayam-potong' ? 'ayam' : 'sayur';
    await click(...BIN_POS[base]);
    await click(...ST_POS.board);
    await sleep(COOK_SECS.board * 1000 + 400);
    await click(...ST_POS.board); // collect
    console.log(`chopped ${base} -> ${raw}`);
    await click(...ST_POS[station]);
    await sleep(COOK_SECS[station] * 1000 + 400);
    await click(...ST_POS[station]); // collect
    console.log(`cooked ${raw} -> ${comp}`);
  } else if (comp === 'ayam-bakar') {
    // handled above; unreachable
  } else {
    await click(...BIN_POS[raw]);
    await click(...ST_POS[station]);
    await sleep(COOK_SECS[station] * 1000 + 400);
    await click(...ST_POS[station]);
    console.log(`cooked ${raw} -> ${comp}`);
  }
  await click(...PLATE_POS);
  console.log(`plated ${comp}`);
}

const state = await evalJs('({plate: window.__world.plate, hand: window.__world.hand, coins: window.__world.coins, served: window.__world.served, timeLeft: Math.round(window.__world.timeLeft)})');
console.log('before serve:', JSON.stringify(state));
// Serve by clicking the first ticket.
await click(114, 128);
await sleep(400);
const after = await evalJs('({plate: window.__world.plate, coins: window.__world.coins, served: window.__world.served, orders: window.__world.orders.length, timeLeft: Math.round(window.__world.timeLeft), screen: window.__screen()})');
console.log('after serve:', JSON.stringify(after));
console.log('console errors:', errors.length ? errors : 'none');
if (after.served >= 1 && after.coins > 0) console.log('PLAYTEST PASS: one order served end-to-end');
else { console.log('PLAYTEST FAIL: order was not served'); process.exit(1); }
// Let the timer run a bit to confirm it counts down.
const t1 = after.timeLeft;
await sleep(3000);
const t2 = await evalJs('Math.round(window.__world.timeLeft)');
console.log(`timer: ${t1} -> ${t2} (should decrease)`);
if (t2 < t1) console.log('TIMER PASS');
else { console.log('TIMER FAIL'); process.exit(1); }
ws.close();
process.exit(0);
