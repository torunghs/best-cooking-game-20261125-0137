// DAPUR BARA — particles: steam puffs over the wok and grill, ember sparks
// rising from the fire, and floating score texts. Purely cosmetic; the
// world spawns them and the renderer draws them.

export function createParticles(random) {
  const list = [];

  function spawnSteam(x, y, dark) {
    list.push({
      kind: 'steam', x: x + (random() - 0.5) * 26, y,
      vx: (random() - 0.5) * 8, vy: -22 - random() * 16,
      life: 0, max: 0.9 + random() * 0.7, size: 7 + random() * 9, dark: !!dark,
    });
  }

  function spawnSpark(x, y) {
    list.push({
      kind: 'spark', x, y, vx: (random() - 0.5) * 26, vy: -40 - random() * 60,
      life: 0, max: 0.5 + random() * 0.5, size: 2 + random() * 2.5,
    });
  }

  function spawnFloatText(x, y, text, color) {
    list.push({ kind: 'text', x, y, vx: 0, vy: -34, life: 0, max: 1.3, text, color });
  }

  function spawnBurst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      const a = random() * Math.PI * 2;
      const sp = 40 + random() * 90;
      list.push({
        kind: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: 0, max: 0.5 + random() * 0.4, size: 2.5 + random() * 3, color,
      });
    }
  }

  return {
    list,
    spawnSteam, spawnSpark, spawnFloatText, spawnBurst,
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += dt;
        if (p.life >= p.max) { list.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'steam') { p.vy -= 6 * dt; p.size += 14 * dt; }
        if (p.kind === 'dot') p.vy += 160 * dt;
      }
      if (list.length > 220) list.splice(0, list.length - 220);
    },
  };
}
