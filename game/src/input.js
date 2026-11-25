// DAPUR BARA — input: mouse position and clicks in playfield coordinates,
// plus the keyboard shortcuts. The world decides what a click means; this
// module only reports it, scaled from the canvas to the 1280x720 field.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_TRASH = 'trash';
export const ACTION_BOOK = 'book';
export const ACTION_SERVE = 'serve';

export function createInput(canvas, toField) {
  const mouse = { x: 0, y: 0, inside: false };
  const clicks = [];
  const keys = [];

  function fieldPos(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width);
    const y = (event.clientY - rect.top) / Math.max(1, rect.height);
    return toField(x, y);
  }

  canvas.addEventListener('pointermove', (event) => {
    const p = fieldPos(event);
    mouse.x = p.x; mouse.y = p.y; mouse.inside = true;
  });
  canvas.addEventListener('pointerleave', () => { mouse.inside = false; });
  canvas.addEventListener('pointerdown', (event) => {
    const p = fieldPos(event);
    mouse.x = p.x; mouse.y = p.y; mouse.inside = true;
    clicks.push({ x: p.x, y: p.y, button: event.button });
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const k = event.key.toLowerCase();
    if (k === 'enter' || k === ' ') { keys.push(ACTION_CONFIRM); event.preventDefault(); }
    else if (k === 'p' || k === 'escape') keys.push(ACTION_PAUSE);
    else if (k === 'm') keys.push(ACTION_MUTE);
    else if (k === 'backspace' || k === 'delete' || k === 't') keys.push(ACTION_TRASH);
    else if (k === 'r') keys.push(ACTION_BOOK);
    else if (k >= '1' && k <= '9') keys.push(k);
    else if (k === 's') keys.push(ACTION_SERVE);
  });

  return {
    mouse,
    takeClicks() { return clicks.splice(0, clicks.length); },
    takeKeys() { return keys.splice(0, keys.length); },
  };
}
