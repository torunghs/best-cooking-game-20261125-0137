// DAPUR BARA — drawing only: the world's state and the current screen in,
// pixels out. The 1280x720 playfield is scaled to fit the window and
// centred, the margin filled with the backdrop colour. All art is canvas
// shapes and text; nothing is loaded from the network.

import { BINS, FIELD, FONT, PALETTE, RECIPES, STATIONS, TARGET_COINS } from './config.js';
import { drawDish, drawItem } from './food.js';
import { plateMatches, plateReadyRecipe } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

// Geometry, shared with hit-testing: every clickable rect lives here.
export const BIN_RECTS = BINS.map((bin, i) => ({
  id: bin.id,
  x: 16 + (i % 5) * 80,
  y: 228 + Math.floor(i / 5) * 72,
  w: 72, h: 62,
}));
export const STATION_RECTS = {
  board: { x: 432, y: 208, w: 196, h: 142 },
  wok: { x: 644, y: 208, w: 196, h: 142 },
  grill: { x: 432, y: 366, w: 196, h: 142 },
};
export const PLATE_RECT = { x: 644, y: 366, w: 196, h: 142 };
export const TRASH_RECT = { x: 864, y: 366, w: 120, h: 142 };
export const BOOK_RECT = { x: 1000, y: 366, w: 264, h: 142 };
export const PASS_RECT = { x: 864, y: 208, w: 400, h: 142 };
export const HAND_RECTS = [
  { x: 40, y: 556, w: 72, h: 72 },
  { x: 124, y: 556, w: 72, h: 72 },
];
export const TOP_BUTTONS = {
  pause: { x: 1130, y: 10, w: 40, h: 38 },
  mute: { x: 1178, y: 10, w: 40, h: 38 },
  book: { x: 1226, y: 10, w: 40, h: 38 },
};
export function ticketRect(i) {
  return { x: 16 + i * 204, y: 66, w: 196, h: 124 };
}
export const START_BUTTON = { x: 440, y: 520, w: 400, h: 64 };

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// What did this click hit? main.js asks this, then calls the world.
export function hitAt(world, x, y) {
  for (const b of BIN_RECTS) if (inside(b, x, y)) return { type: 'bin', id: b.id };
  for (const kind of Object.keys(STATION_RECTS)) {
    if (inside(STATION_RECTS[kind], x, y)) return { type: 'station', kind };
  }
  if (inside(PLATE_RECT, x, y)) return { type: 'plate' };
  if (inside(TRASH_RECT, x, y)) return { type: 'trash' };
  if (inside(BOOK_RECT, x, y)) return { type: 'book' };
  for (const key of Object.keys(TOP_BUTTONS)) {
    if (inside(TOP_BUTTONS[key], x, y)) return { type: key };
  }
  for (let i = 0; i < world.orders.length; i++) {
    if (inside(ticketRect(i), x, y)) return { type: 'ticket', order: world.orders[i] };
  }
  return null;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left', bold = false) {
    const key = `${size}-${bold}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? 'bold ' : ''}${size}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function drawFace(customer, x, y, r, mood) {
    // mood: 1 happy .. 0 upset. The face reads the patience bar at a glance.
    ctx.fillStyle = customer.skin;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = customer.hair;
    if (customer.style === 'bun') {
      ctx.beginPath(); ctx.arc(x, y - r * 0.75, r * 0.55, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - r * 1.25, r * 0.28, 0, Math.PI * 2); ctx.fill();
    } else if (customer.style === 'long') {
      ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.9, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
      ctx.fillRect(x - r * 0.95, y - r * 0.5, r * 0.28, r * 1.1);
      ctx.fillRect(x + r * 0.67, y - r * 0.5, r * 0.28, r * 1.1);
    } else if (customer.style === 'cap') {
      ctx.beginPath(); ctx.arc(x, y - r * 0.45, r * 0.95, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x - r, y - r * 0.62, r * 2, r * 0.3);
    } else if (customer.style === 'spiky') {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * r * 0.4 - r * 0.2, y - r * 0.5);
        ctx.lineTo(x + i * r * 0.4, y - r * 1.15);
        ctx.lineTo(x + i * r * 0.4 + r * 0.2, y - r * 0.5);
        ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.85, Math.PI, 0); ctx.fill();
    }
    // Eyes.
    ctx.fillStyle = '#241a12';
    const eyeY = y - r * 0.08;
    ctx.beginPath(); ctx.arc(x - r * 0.34, eyeY, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.34, eyeY, r * 0.09, 0, Math.PI * 2); ctx.fill();
    // Mouth: smile when patient, flat line when not.
    ctx.strokeStyle = '#7a3b1e';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    if (mood > 0.5) {
      ctx.arc(x, y + r * 0.28, r * 0.38, Math.PI * 0.15, Math.PI * 0.85);
    } else if (mood > 0.25) {
      ctx.moveTo(x - r * 0.3, y + r * 0.45);
      ctx.lineTo(x + r * 0.3, y + r * 0.45);
    } else {
      ctx.arc(x, y + r * 0.85, r * 0.32, Math.PI * 1.15, Math.PI * 1.85);
    }
    ctx.stroke();
  }

  function drawBackground(now) {
    // Brick wall, warm lamps, tiled floor.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 210; y += 26) {
      for (let x = (y / 26 % 2) * 30; x < FIELD.width; x += 60) {
        ctx.fillRect(x, y, 56, 2);
      }
    }
    // Hanging lamps.
    for (const lx of [300, 640, 980]) {
      ctx.strokeStyle = '#2b1608';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 26); ctx.stroke();
      const flick = 0.85 + Math.sin(now / 300 + lx) * 0.08;
      ctx.fillStyle = `rgba(255, 194, 26, ${0.25 * flick})`;
      ctx.beginPath(); ctx.arc(lx, 44, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc21a';
      ctx.beginPath(); ctx.arc(lx, 40, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a2e';
      ctx.beginPath(); ctx.moveTo(lx - 18, 34); ctx.lineTo(lx + 18, 34); ctx.lineTo(lx + 10, 22); ctx.lineTo(lx - 10, 22); ctx.closePath(); ctx.fill();
    }
    // Floor.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 524, FIELD.width, 196);
    ctx.fillStyle = PALETTE.floorTile;
    for (let y = 524; y < 720; y += 48) {
      for (let x = (y / 48 % 2) * 48; x < FIELD.width; x += 96) {
        ctx.fillRect(x + 2, y + 2, 92, 44);
      }
    }
    // Window with the street outside, top right of the wall.
    ctx.fillStyle = '#2b1608';
    ctx.fillRect(1064, 66, 200, 124);
    ctx.fillStyle = '#f7b733';
    ctx.fillRect(1072, 74, 184, 108);
    ctx.fillStyle = '#e8821e';
    ctx.beginPath(); ctx.arc(1210, 110, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a3b1e';
    ctx.fillRect(1072, 150, 184, 32);
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(1100, 132, 26, 50);
    ctx.fillRect(1160, 140, 34, 42);
    text('JALAN RAYA', 1164, 100, 13, '#2b1608', 'center', true);
  }

  function drawTopBar(world, opts) {
    ctx.fillStyle = '#241207';
    ctx.fillRect(0, 0, FIELD.width, 58);
    ctx.fillStyle = PALETTE.ember;
    text('🔥 DAPUR BARA', 16, 38, 26, '#ffc21a', 'left', true);
    text('Ember Kitchen', 272, 38, 14, '#f5e6c4');
    // Shift timer, big and central.
    const urgent = world.timeLeft <= 30 && !world.over;
    const pulse = urgent ? 1 + Math.sin(Date.now() / 150) * 0.06 : 1;
    ctx.save();
    ctx.translate(640, 30);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = urgent ? '#ff5a4d' : '#fff3d6';
    roundRect(ctx, -78, -24, 156, 48, 10);
    ctx.fill();
    text(`⏱ ${fmtTime(world.timeLeft)}`, 0, 10, 26, urgent ? '#a31212' : '#2b1608', 'center', true);
    ctx.restore();
    // Coins.
    ctx.fillStyle = '#ffc21a';
    ctx.beginPath(); ctx.arc(748, 29, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a2e';
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Rp', 748, 35);
    text(`${world.coins}`, 770, 38, 24, '#fff3d6', 'left', true);
    text(`target ${TARGET_COINS.one}`, 770, 54, 11, '#c9a86a');
    // Reputation hearts.
    for (let i = 0; i < 3; i++) {
      const hx = 920 + i * 30;
      ctx.fillStyle = i < world.reputation ? '#e5484d' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(hx, 38);
      ctx.bezierCurveTo(hx - 12, 26, hx - 22, 36, hx, 48);
      ctx.bezierCurveTo(hx + 22, 36, hx + 12, 26, hx, 38);
      ctx.fill();
    }
    // Combo badge.
    if (world.combo >= 2) {
      ctx.fillStyle = '#ff7a1a';
      roundRect(ctx, 1010, 12, 96, 34, 17);
      ctx.fill();
      text(`KOMBO x${world.combo}`, 1058, 35, 16, '#fff', 'center', true);
    }
    // Top-right buttons.
    const buttons = [
      ['pause', '❚❚', 'Jeda (P)'],
      ['mute', opts.muted ? '✕♪' : '♪', 'Suara (M)'],
      ['book', '?', 'Resep (R)'],
    ];
    for (const [key, label] of buttons) {
      const b = TOP_BUTTONS[key];
      ctx.fillStyle = '#3d2b1f';
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(label, b.x + b.w / 2, b.y + 25, 16, '#fff3d6', 'center', true);
    }
  }

  function drawOrderBoard(world, now) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, 10, 60, 834, 136, 10);
    ctx.fill();
    if (world.rush) {
      ctx.strokeStyle = '#e5484d';
      ctx.lineWidth = 3;
      roundRect(ctx, 10, 60, 834, 136, 10);
      ctx.stroke();
      text('⚠ JAM RAMAI!', 812, 80, 13, '#ff8a7a', 'right', true);
    }
    text('PAPAN PESANAN', 20, 80, 13, '#f5e6c4', 'left', true);
    if (world.orders.length === 0) {
      text('Belum ada pesanan — pelanggan segera datang…', 420, 140, 16, '#f5e6c4', 'center');
      return;
    }
    const ready = plateReadyRecipe(world);
    world.orders.forEach((order, i) => {
      const r = ticketRect(i);
      const ratio = Math.max(0, order.patience / order.patienceMax);
      const isReady = ready && ready.id === order.id;
      ctx.fillStyle = PALETTE.ticket;
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      ctx.strokeStyle = isReady ? '#58b368' : PALETTE.ticketEdge;
      ctx.lineWidth = isReady ? 4 : 2;
      ctx.stroke();
      if (isReady) {
        const glow = 0.5 + Math.sin(now / 180) * 0.3;
        ctx.fillStyle = `rgba(88,179,104,${glow})`;
        roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10);
        ctx.stroke();
      }
      drawFace(order.customer, r.x + 26, r.y + 30, 20, ratio);
      text(order.customer.name, r.x + 52, r.y + 24, 13, '#2b1608', 'left', true);
      text(order.recipe.short, r.x + 52, r.y + 41, 12, '#7a3b1e', 'left', true);
      drawDish(ctx, order.recipe.id, r.x + 164, r.y + 32, 52);
      // Component checklist.
      order.recipe.components.forEach((comp, ci) => {
        const done = world.plate.includes(comp);
        const cx = r.x + 14 + ci * 34;
        const cy = r.y + 66;
        ctx.fillStyle = done ? '#58b368' : '#fff';
        ctx.beginPath(); ctx.arc(cx + 12, cy + 8, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = done ? '#2f7a38' : '#b09a6a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawItem(ctx, comp, cx + 12, cy + 8, 18);
        if (done) {
          ctx.strokeStyle = '#2f7a38';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy + 8); ctx.lineTo(cx + 10, cy + 14); ctx.lineTo(cx + 20, cy + 2);
          ctx.stroke();
        }
      });
      // Patience bar.
      ctx.fillStyle = '#e8dcc0';
      roundRect(ctx, r.x + 12, r.y + 96, r.w - 24, 10, 5);
      ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? '#58b368' : ratio > 0.25 ? '#f7c948' : '#e5484d';
      roundRect(ctx, r.x + 12, r.y + 96, (r.w - 24) * ratio, 10, 5);
      ctx.fill();
      text(`Rp${order.recipe.price}  +tip`, r.x + r.w - 12, r.y + 122, 11, '#7a3b1e', 'right', true);
      if (isReady) text('SIAP SAJI!', r.x + 12, r.y + 122, 12, '#2f7a38', 'left', true);
    });
  }

  function drawBins(world) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, 10, 202, 412, 172, 10);
    ctx.fill();
    text('BAHAN — KLIK / TEKAN 1–9', 20, 222, 13, '#f5e6c4', 'left', true);
    BIN_RECTS.forEach((rect, i) => {
      const bin = BINS[i];
      ctx.fillStyle = PALETTE.counterTop;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#6a421f';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = bin.color;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + 24, 19, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      drawItem(ctx, bin.id, rect.x + rect.w / 2, rect.y + 22, 30);
      text(bin.name, rect.x + rect.w / 2, rect.y + 52, 12, '#2b1608', 'center', true);
      ctx.fillStyle = '#8a5a2e';
      ctx.beginPath(); ctx.arc(rect.x + rect.w - 10, rect.y + 10, 8, 0, Math.PI * 2); ctx.fill();
      text(bin.key, rect.x + rect.w - 10, rect.y + 14, 10, '#fff', 'center', true);
    });
  }

  function progressRing(cx, cy, r, ratio, color) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2); ctx.stroke();
  }

  function drawStations(world, now) {
    for (const kind of ['board', 'wok', 'grill']) {
      const rect = STATION_RECTS[kind];
      const st = world.stations[kind];
      const def = STATIONS[kind];
      ctx.fillStyle = PALETTE.counter;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.fillStyle = PALETTE.counterTop;
      roundRect(ctx, rect.x, rect.y, rect.w, 26, 10);
      ctx.fill();
      ctx.fillRect(rect.x, rect.y + 16, rect.w, 10);
      text(def.name.toUpperCase(), rect.x + 12, rect.y + 19, 13, '#2b1608', 'left', true);
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + 82;
      if (kind === 'board') {
        ctx.fillStyle = PALETTE.board;
        roundRect(ctx, rect.x + 28, rect.y + 46, 140, 66, 8);
        ctx.fill();
        ctx.strokeStyle = '#c9a86a';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (st.input) drawItem(ctx, st.input, cx, cy, 44);
        // Knife.
        ctx.fillStyle = PALETTE.steel;
        ctx.save();
        ctx.translate(rect.x + 158, rect.y + 60);
        ctx.rotate(0.5);
        ctx.fillRect(0, -4, 34, 8);
        ctx.restore();
        ctx.fillStyle = '#2b1608';
        ctx.fillRect(rect.x + 150, rect.y + 66, 14, 6);
      } else if (kind === 'wok') {
        // Fire under the wok.
        const fl = Math.sin(now / 90) * 4;
        ctx.fillStyle = PALETTE.fire;
        ctx.beginPath();
        ctx.moveTo(cx - 34, rect.y + 128);
        ctx.quadraticCurveTo(cx - 26, rect.y + 96 + fl, cx - 10, rect.y + 122);
        ctx.quadraticCurveTo(cx, rect.y + 100 - fl, cx + 10, rect.y + 122);
        ctx.quadraticCurveTo(cx + 26, rect.y + 96 + fl, cx + 34, rect.y + 128);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.flame;
        ctx.beginPath();
        ctx.moveTo(cx - 18, rect.y + 128);
        ctx.quadraticCurveTo(cx - 12, rect.y + 108, cx, rect.y + 120);
        ctx.quadraticCurveTo(cx + 12, rect.y + 108, cx + 18, rect.y + 128);
        ctx.closePath();
        ctx.fill();
        // Wok.
        ctx.fillStyle = '#23272e';
        ctx.beginPath();
        ctx.arc(cx, cy + 6, 52, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3a4048';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 52, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        if (st.input) drawItem(ctx, st.input, cx, cy - 2, 44);
      } else {
        // Grill grate.
        ctx.fillStyle = '#23272e';
        roundRect(ctx, rect.x + 24, rect.y + 52, 148, 56, 8);
        ctx.fill();
        ctx.strokeStyle = '#6a7078';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(rect.x + 30, rect.y + 62 + i * 11);
          ctx.lineTo(rect.x + 166, rect.y + 62 + i * 11);
          ctx.stroke();
        }
        // Embers.
        ctx.fillStyle = PALETTE.ember;
        for (let i = 0; i < 5; i++) {
          const ex = rect.x + 44 + i * 28;
          const ey = rect.y + 104 + Math.sin(now / 200 + i * 2) * 2;
          ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
        }
        if (st.input) drawItem(ctx, st.input, cx, cy, 44);
      }
      // Status: progress, done, burnt.
      if (st.input && !st.done) {
        progressRing(cx, cy - 4, 34, st.progress, '#ffc21a');
        text(`${def.verb}… ${Math.ceil((1 - st.progress) * def.seconds)} dtk`, cx, rect.y + 134, 12, '#fff3d6', 'center', true);
      } else if (st.done && !st.burnt) {
        const glow = 0.5 + Math.sin(now / 160) * 0.3;
        ctx.fillStyle = `rgba(88,179,104,${glow})`;
        roundRect(ctx, rect.x + 8, rect.y + 112, rect.w - 16, 24, 8);
        ctx.fill();
        text('SIAP! Klik untuk ambil', cx, rect.y + 129, 12, '#0e3d16', 'center', true);
      } else if (st.burnt) {
        ctx.fillStyle = '#1c1c1c';
        roundRect(ctx, rect.x + 8, rect.y + 112, rect.w - 16, 24, 8);
        ctx.fill();
        text('GOSONG! Klik untuk buang', cx, rect.y + 129, 12, '#ff8a7a', 'center', true);
      } else {
        text('Kosong — klik dengan bahan', cx, rect.y + 129, 11, '#c9a86a', 'center');
      }
    }

    // Plating station.
    const rect = PLATE_RECT;
    const ready = plateReadyRecipe(world);
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x, rect.y, rect.w, 26, 10);
    ctx.fill();
    ctx.fillRect(rect.x, rect.y + 16, rect.w, 10);
    text('PIRING SAJI', rect.x + 12, rect.y + 19, 13, '#2b1608', 'left', true);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + 82;
    ctx.fillStyle = '#f7f2e6';
    ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3d9bd';
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
    if (world.plate.length === 0) {
      text('Piring kosong', cx, cy + 4, 12, '#8a7a5a', 'center');
    } else {
      world.plate.forEach((item, i) => {
        const a = -Math.PI / 2 + (i - (world.plate.length - 1) / 2) * 0.9;
        drawItem(ctx, item, cx + Math.cos(a) * 16, cy + Math.sin(a) * 12, 30);
      });
    }
    if (ready) {
      const glow = 0.5 + Math.sin(now / 160) * 0.3;
      ctx.fillStyle = `rgba(88,179,104,${glow})`;
      roundRect(ctx, rect.x + 8, rect.y + 112, rect.w - 16, 24, 8);
      ctx.fill();
      text('SIAP — klik tiket pesanan!', cx, rect.y + 129, 12, '#0e3d16', 'center', true);
    } else if (world.plate.length > 0) {
      text('Belum lengkap — cek papan', cx, rect.y + 129, 11, '#fff3d6', 'center');
    } else {
      text('Taruh bahan matang di sini', cx, rect.y + 129, 11, '#c9a86a', 'center');
    }
  }

  function drawRightPanel(world, now) {
    // Pass window: the plate, enlarged, with the serve hint.
    const r = PASS_RECT;
    ctx.fillStyle = '#2b1608';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    text('MEJA SAJI', r.x + 14, r.y + 22, 13, '#f5e6c4', 'left', true);
    const ready = plateReadyRecipe(world);
    const cx = r.x + 70;
    const cy = r.y + 82;
    ctx.fillStyle = '#f7f2e6';
    ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3d9bd';
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    if (world.plate.length > 0) {
      world.plate.forEach((item, i) => {
        const a = -Math.PI / 2 + (i - (world.plate.length - 1) / 2) * 0.9;
        drawItem(ctx, item, cx + Math.cos(a) * 15, cy + Math.sin(a) * 11, 28);
      });
    }
    if (ready) {
      const glow = 0.55 + Math.sin(now / 160) * 0.3;
      ctx.fillStyle = `rgba(88,179,104,${glow})`;
      roundRect(ctx, r.x + 130, r.y + 40, r.w - 150, 62, 10);
      ctx.fill();
      text('SIAP SAJI!', r.x + 130 + (r.w - 150) / 2, r.y + 66, 18, '#0e3d16', 'center', true);
      text(`Klik tiket ${ready.customer.name}`, r.x + 130 + (r.w - 150) / 2, r.y + 88, 13, '#0e3d16', 'center');
    } else {
      text('Piring dirakit di Piring Saji,', r.x + 140, r.y + 66, 14, '#f5e6c4');
      text('lalu klik tiket pesanan', r.x + 140, r.y + 86, 14, '#f5e6c4');
      text('yang cocok untuk menyajikan.', r.x + 140, r.y + 106, 14, '#c9a86a');
    }
    text(`Tersaji: ${world.served}   Gagal: ${world.lost}   Gosong: ${world.burned}`, r.x + 14, r.y + 132, 13, '#f5e6c4');

    // Trash.
    const t = TRASH_RECT;
    ctx.fillStyle = '#3d2b1f';
    roundRect(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5a6a72';
    ctx.beginPath();
    ctx.moveTo(t.x + 30, t.y + 46);
    ctx.lineTo(t.x + 90, t.y + 46);
    ctx.lineTo(t.x + 84, t.y + 118);
    ctx.lineTo(t.x + 36, t.y + 118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a8a92';
    ctx.fillRect(t.x + 26, t.y + 38, 68, 8);
    text('TEMPAT', t.x + t.w / 2, t.y + 24, 13, '#f5e6c4', 'center', true);
    text('SAMPAH (T)', t.x + t.w / 2, t.y + 136, 12, '#c9a86a', 'center');

    // Recipe book button.
    const b = BOOK_RECT;
    ctx.fillStyle = '#7a3b1e';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff8e1';
    ctx.fillRect(b.x + 22, b.y + 18, 60, 80);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(b.x + 22, b.y + 18, 60, 14);
    text('BUKU RESEP', b.x + 96, b.y + 52, 22, '#fff3d6', 'left', true);
    text('5 hidangan • klik / tekan R', b.x + 96, b.y + 78, 13, '#f5e6c4', 'left');
    text('Pelajari urutan masaknya!', b.x + 96, b.y + 100, 13, '#c9a86a', 'left');
  }

  function drawBottomStrip(world, now) {
    // The work counter: hand slots, toast, and the chef.
    ctx.fillStyle = '#6a421f';
    ctx.fillRect(0, 524, FIELD.width, 8);
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(0, 532, FIELD.width, 132);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 532, FIELD.width, 6);
    text('TANGAN', 40, 552, 13, '#f5e6c4', 'left', true);
    HAND_RECTS.forEach((rect, i) => {
      ctx.fillStyle = '#2b1608';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.strokeStyle = '#d9b96a';
      ctx.lineWidth = 2;
      ctx.stroke();
      const item = world.hand[i];
      if (item) drawItem(ctx, item, rect.x + rect.w / 2, rect.y + rect.h / 2, 52);
      else text('—', rect.x + rect.w / 2, rect.y + 46, 22, '#8a7a5a', 'center');
    });
    // Toast / hint.
    const msg = world.toastTimer > 0 ? world.toast
      : 'Klik bahan → klik stasiun → ambil hasil → taruh di Piring Saji → klik tiket pesanan.';
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, 216, 556, 560, 72, 10);
    ctx.fill();
    ctx.fillStyle = '#2b1608';
    ctx.font = `15px ${FONT}`;
    ctx.textAlign = 'left';
    wrapText(msg, 232, 584, 528, 20);
    // The chef, idle by the counter.
    const cx = 1150;
    const cy = 600;
    const bob = Math.sin(now / 400) * 2;
    // Coat and apron, behind the counter's top edge.
    ctx.fillStyle = '#f7f2e6';
    roundRect(ctx, cx - 30, cy - 26 + bob, 60, 58, 12);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 24 + bob); ctx.lineTo(cx + 12, cy - 24 + bob); ctx.lineTo(cx, cy - 8 + bob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1608';
    ctx.beginPath(); ctx.arc(cx - 8, cy + 2 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy + 2 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 8, cy + 16 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy + 16 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7f2e6';
    ctx.beginPath(); ctx.arc(cx, cy - 52 + bob, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy - 78 + bob, 24, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 24, cy - 80 + bob, 48, 10);
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(cx, cy - 46 + bob, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.arc(cx - 7, cy - 50 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 7, cy - 50 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a3b1e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy - 40 + bob, 8, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    text('KOKI BARA', cx, cy + 52, 13, '#f5e6c4', 'center', true);
    // Controls line.
    text('1–9 bahan  •  Spasi sajikan  •  T buang  •  R resep  •  P jeda  •  M suara', 640, 700, 13, '#f5e6c4', 'center');
  }

  function wrapText(msg, x, y, maxWidth, lineHeight) {
    const words = msg.split(' ');
    let line = '';
    let yy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
  }

  function drawParticles(particles) {
    for (const p of particles.list) {
      const a = 1 - p.life / p.max;
      if (p.kind === 'steam') {
        ctx.fillStyle = p.dark ? `rgba(60,60,60,${0.45 * a})` : `rgba(255,255,255,${0.5 * a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.fillStyle = `rgba(255,194,26,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'dot') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === 'text') {
        ctx.font = `bold 22px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawBookOverlay() {
    ctx.fillStyle = 'rgba(20,10,4,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e1';
    roundRect(ctx, 240, 60, 800, 600, 14);
    ctx.fill();
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text('BUKU RESEP — DAPUR BARA', 640, 110, 30, '#7a3b1e', 'center', true);
    text('Klik bahan, olah di stasiun yang tepat, rakit di Piring Saji, sajikan ke tiket yang cocok.', 640, 138, 15, '#5a3d22', 'center');
    let y = 170;
    for (const recipe of RECIPES) {
      drawDish(ctx, recipe.id, 300, y + 22, 64);
      text(recipe.name, 350, y + 20, 20, '#2b1608', 'left', true);
      text(`Rp${recipe.price} + tip kesabaran`, 350, y + 44, 14, '#7a3b1e', 'left');
      text(recipe.blurb, 350, y + 66, 14, '#5a3d22', 'left');
      // Component flow.
      let cx = 760;
      recipe.components.forEach((comp, i) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, y + 22, 20, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b09a6a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawItem(ctx, comp, cx, y + 22, 28);
        if (i < recipe.components.length - 1) text('＋', cx + 26, y + 30, 16, '#7a3b1e', 'center', true);
        cx += 52;
      });
      y += 88;
    }
    text('Talenan: ayam & sayur  •  Wajan: nasi, mie, telur, tahu  •  Panggangan: ayam & ayam potong', 640, 620, 14, '#5a3d22', 'center');
    text('Makanan matang yang dibiarkan 5 detik di wajan/panggangan akan GOSONG. Klik R / ✕ untuk menutup.', 640, 644, 14, '#a31212', 'center', true);
  }

  function drawTitle(world, best) {
    ctx.fillStyle = 'rgba(20,10,4,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e1';
    roundRect(ctx, 290, 90, 700, 500, 16);
    ctx.fill();
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text('🔥 DAPUR BARA 🔥', 640, 160, 52, '#c65a1e', 'center', true);
    text('Ember Kitchen — warung jalanan yang tak pernah padam', 640, 196, 18, '#7a3b1e', 'center');
    text('Shift 3 menit. Layani pelanggan sebelum sabar mereka habis.', 640, 240, 17, '#2b1608', 'center');
    text('Potong, goreng, panggang — rakit hidangan di Piring Saji,', 640, 268, 17, '#2b1608', 'center');
    text('lalu klik tiket pesanan yang cocok untuk menyajikan.', 640, 296, 17, '#2b1608', 'center');
    text('Kombo beruntun menaikkan bayaran. Reputasi habis = shift berakhir.', 640, 324, 17, '#2b1608', 'center');
    text('Target: Rp120 ★  •  Rp200 ★★  •  Rp300 ★★★', 640, 360, 17, '#a03d12', 'center', true);
    text('Klik bahan atau tekan 1–9  •  Spasi menyajikan  •  R buku resep', 640, 392, 15, '#5a3d22', 'center');
    if (best > 0) text(`Rekor terbaik: Rp${best}`, 640, 424, 16, '#2f7a38', 'center', true);
    ctx.fillStyle = '#e5484d';
    roundRect(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, 10, 12);
    ctx.fill();
    text('MULAI MASAK  ▶', 640, START_BUTTON.y + 42, 26, '#fff', 'center', true);
    text('Klik tombol atau tekan Enter', 640, START_BUTTON.y + 88, 14, '#7a3b1e', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20,10,4,0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text('JEDA', 640, 330, 56, '#fff3d6', 'center', true);
    text('Tekan P atau klik ❚❚ untuk melanjutkan', 640, 372, 18, '#f5e6c4', 'center');
  }

  function drawOver(world, best) {
    const over = world.over;
    ctx.fillStyle = 'rgba(20,10,4,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e1';
    roundRect(ctx, 340, 110, 600, 480, 16);
    ctx.fill();
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (over.won) {
      text('SHIFT SELESAI!', 640, 180, 40, '#2f7a38', 'center', true);
      text('Warungmu tetap ramai sampai tutup.', 640, 214, 17, '#5a3d22', 'center');
    } else if (over.finished) {
      text('SHIFT SELESAI', 640, 180, 40, '#a03d12', 'center', true);
      text('Waktu habis — target Rp120 belum tercapai.', 640, 214, 17, '#5a3d22', 'center');
    } else {
      text('WARUNG SEPI…', 640, 180, 40, '#a31212', 'center', true);
      text('Reputasi habis — pelanggan pergi semua.', 640, 214, 17, '#5a3d22', 'center');
    }
    // Stars.
    for (let i = 0; i < 3; i++) {
      const sx = 560 + i * 80;
      ctx.fillStyle = i < over.stars ? '#ffc21a' : '#d9cba6';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 === 0 ? 34 : 15;
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const px = sx + Math.cos(a) * r;
        const py = 268 + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    text(`Pendapatan: Rp${over.coins}`, 640, 350, 26, '#2b1608', 'center', true);
    text(`Pesanan tersaji: ${over.served}   •   Pelanggan pergi: ${over.lost}`, 640, 388, 17, '#5a3d22', 'center');
    text(`Kombo terbaik: x${over.bestCombo}`, 640, 416, 17, '#5a3d22', 'center');
    if (over.coins > best) text(`Rekor baru! Sebelumnya Rp${best}`, 640, 448, 17, '#2f7a38', 'center', true);
    else if (best > 0) text(`Rekor terbaik: Rp${best}`, 640, 448, 17, '#7a3b1e', 'center');
    ctx.fillStyle = '#e5484d';
    roundRect(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h, 12);
    ctx.fill();
    text('MASAK LAGI  ▶', 640, START_BUTTON.y + 42, 26, '#fff', 'center', true);
    text('Klik tombol atau tekan Enter', 640, START_BUTTON.y + 88, 14, '#7a3b1e', 'center');
  }

  function draw(world, screen, opts, particles) {
    const now = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1c1008';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawBackground(now);
    drawTopBar(world, opts);
    drawOrderBoard(world, now);
    drawBins(world);
    drawStations(world, now);
    drawRightPanel(world, now);
    drawBottomStrip(world, now);
    drawParticles(particles);
    if (opts.bookOpen) drawBookOverlay();
    else if (screen === SCREEN_TITLE) drawTitle(world, opts.best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(world, opts.best);
  }

  return { draw, resize, view };
}
