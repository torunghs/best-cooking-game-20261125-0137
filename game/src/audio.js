// DAPUR BARA — all sound is synthesized with WebAudio: no audio files,
// no network. A short blip for picking up, a chop thock, a sizzle loop
// while the wok or grill is busy, a ding for a served plate, an alarm for
// a burn, and a little pentatonic jingle for a win. Sound starts only
// after the first user gesture (the browser's rule) and M mutes it.

export function createAudio() {
  let context = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!context) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        context = new AC();
      } catch { context = null; }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, gain, filterFreq, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }

  function startSizzle() {
    const ctx = ensure();
    if (!ctx || muted || sizzleNodes) return;
    const len = ctx.sampleRate * 1.2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
    sizzleNodes = { src, g };
  }

  function stopSizzle() {
    if (!sizzleNodes || !context) return;
    const nodes = sizzleNodes;
    sizzleNodes = null;
    try {
      nodes.g.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.25);
      nodes.src.stop(context.currentTime + 0.3);
    } catch { /* already stopped */ }
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; if (muted) stopSizzle(); return muted; },
    pickup() { tone(520, 0.07, 'sine', 0.12); tone(780, 0.06, 'sine', 0.08, 0.05); },
    drop() { tone(300, 0.06, 'sine', 0.1, 0, 180); },
    chop() { noise(0.09, 0.22, 900); tone(140, 0.08, 'triangle', 0.16, 0, 70); },
    startCook() { tone(220, 0.12, 'triangle', 0.12, 0, 330); startSizzle(); },
    done() { tone(880, 0.1, 'sine', 0.14); tone(1318, 0.14, 'sine', 0.12, 0.09); stopSizzle(); },
    serve() {
      tone(1046, 0.1, 'sine', 0.14);
      tone(1318, 0.1, 'sine', 0.14, 0.09);
      tone(1568, 0.18, 'sine', 0.14, 0.18);
    },
    burn() { tone(196, 0.3, 'sawtooth', 0.12, 0, 98); noise(0.25, 0.12, 500); stopSizzle(); },
    angry() { tone(330, 0.15, 'square', 0.07, 0, 220); tone(262, 0.2, 'square', 0.07, 0.14, 175); },
    tick() { tone(1200, 0.04, 'sine', 0.07); },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.11));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.11, i * 0.16));
    },
    setSizzle(on) { if (on) startSizzle(); else stopSizzle(); },
  };
}
