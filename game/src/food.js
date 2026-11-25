// DAPUR BARA — food art: every ingredient and finished dish drawn in code
// with canvas shapes. No images, no emoji: the same drawings appear on the
// bins, in the hand, on the plate and on the order tickets, so the player
// learns to read a dish at a glance.

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function plate(ctx, x, y, r) {
  ctx.fillStyle = '#f7f2e6';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#e3d9bd';
  circle(ctx, x, y, r * 0.78);
  ctx.fillStyle = '#fbf8ef';
  circle(ctx, x, y, r * 0.62);
}

function bowl(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x - r, y - 2, r * 2, 3);
}

// Draw one item centred at (x, y) inside a box of `size` pixels.
export function drawItem(ctx, id, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#f6efdd';
      ellipse(ctx, 0, s * 0.06, s * 0.42, s * 0.26);
      ctx.fillStyle = '#fffdf4';
      ellipse(ctx, -s * 0.08, -s * 0.06, s * 0.3, s * 0.2);
      ctx.fillStyle = '#d9cba6';
      for (let i = 0; i < 5; i++) circle(ctx, -s * 0.28 + i * s * 0.13, s * 0.12 - (i % 2) * s * 0.08, s * 0.03);
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#f2b705';
      ctx.lineWidth = s * 0.07;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.34, -s * 0.16 + i * s * 0.13);
        ctx.bezierCurveTo(-s * 0.1, -s * 0.26 + i * s * 0.13, s * 0.12, -s * 0.06 + i * s * 0.13, s * 0.34, -s * 0.16 + i * s * 0.13);
        ctx.stroke();
      }
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fffdf4';
      ellipse(ctx, 0, 0, s * 0.42, s * 0.3);
      ctx.fillStyle = '#ff9d00';
      circle(ctx, s * 0.05, -s * 0.02, s * 0.17);
      ctx.fillStyle = '#ffc21a';
      circle(ctx, s * 0.02, -s * 0.05, s * 0.1);
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#f2a594';
      ellipse(ctx, -s * 0.05, s * 0.05, s * 0.3, s * 0.24);
      ctx.fillStyle = '#e88a76';
      ellipse(ctx, -s * 0.12, -s * 0.08, s * 0.2, s * 0.16);
      ctx.fillStyle = '#f7e8d8';
      circle(ctx, s * 0.3, s * 0.22, s * 0.09);
      ctx.strokeStyle = '#f7e8d8';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.12); ctx.lineTo(s * 0.32, s * 0.24); ctx.stroke();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#3f9e4d';
      ellipse(ctx, -s * 0.14, s * 0.05, s * 0.2, s * 0.3);
      ellipse(ctx, s * 0.14, s * 0.02, s * 0.2, s * 0.32);
      ctx.fillStyle = '#7dc383';
      ellipse(ctx, 0, -s * 0.12, s * 0.16, s * 0.3);
      ctx.strokeStyle = '#2f7a38';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.35); ctx.lineTo(0, s * 0.3); ctx.stroke();
      break;
    }
    case 'tahu': {
      ctx.fillStyle = '#fdf3d0';
      ctx.fillRect(-s * 0.3, -s * 0.22, s * 0.6, s * 0.44);
      ctx.fillStyle = '#f2df9e';
      ctx.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.12);
      ctx.strokeStyle = '#d9c078';
      ctx.lineWidth = s * 0.03;
      ctx.strokeRect(-s * 0.3, -s * 0.22, s * 0.6, s * 0.44);
      break;
    }
    case 'kecap': {
      ctx.fillStyle = '#3a1c08';
      ctx.fillRect(-s * 0.14, -s * 0.3, s * 0.28, s * 0.6);
      ctx.fillStyle = '#5a2d12';
      ctx.fillRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.35);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-s * 0.14, -s * 0.42, s * 0.28, s * 0.14);
      ctx.fillStyle = '#fff3d6';
      ctx.font = `bold ${Math.round(s * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('K', 0, s * 0.18);
      break;
    }
    case 'sambal': {
      bowl(ctx, 0, s * 0.05, s * 0.4, '#b3271e');
      ctx.fillStyle = '#e5484d';
      ellipse(ctx, 0, s * 0.02, s * 0.32, s * 0.12);
      ctx.fillStyle = '#ff8a5c';
      for (let i = 0; i < 4; i++) circle(ctx, -s * 0.2 + i * s * 0.13, -s * 0.02 - (i % 2) * s * 0.05, s * 0.045);
      break;
    }
    case 'kacang': {
      bowl(ctx, 0, s * 0.05, s * 0.4, '#8a5a2e');
      ctx.fillStyle = '#c98d4b';
      ellipse(ctx, 0, s * 0.02, s * 0.32, s * 0.12);
      ctx.fillStyle = '#f7e8c8';
      for (let i = 0; i < 3; i++) circle(ctx, -s * 0.14 + i * s * 0.14, s * 0.02, s * 0.04);
      break;
    }
    case 'ayam-potong': {
      ctx.fillStyle = '#f2a594';
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.translate(i * s * 0.24, (i % 2) * s * 0.08);
        ctx.rotate(i * 0.5);
        ctx.fillRect(-s * 0.13, -s * 0.13, s * 0.26, s * 0.26);
        ctx.restore();
      }
      ctx.fillStyle = '#e88a76';
      circle(ctx, -s * 0.24, -s * 0.05, s * 0.05);
      circle(ctx, s * 0.24, s * 0.1, s * 0.05);
      break;
    }
    case 'sayur-potong': {
      ctx.fillStyle = '#7dc383';
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(-s * 0.28 + i * s * 0.14, (i % 2 ? -s * 0.08 : s * 0.1));
        ctx.rotate(i * 0.9);
        ctx.fillRect(-s * 0.05, -s * 0.16, s * 0.1, s * 0.32);
        ctx.restore();
      }
      break;
    }
    case 'nasi-goreng': {
      ctx.fillStyle = '#e8821e';
      ellipse(ctx, 0, s * 0.06, s * 0.42, s * 0.26);
      ctx.fillStyle = '#f7c948';
      ellipse(ctx, -s * 0.08, -s * 0.06, s * 0.3, s * 0.2);
      ctx.fillStyle = '#3f9e4d';
      circle(ctx, -s * 0.26, s * 0.08, s * 0.05);
      circle(ctx, s * 0.2, -s * 0.02, s * 0.05);
      ctx.fillStyle = '#d92b1f';
      circle(ctx, s * 0.05, s * 0.14, s * 0.045);
      break;
    }
    case 'mie-goreng': {
      ctx.strokeStyle = '#d98a1f';
      ctx.lineWidth = s * 0.08;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.34, -s * 0.16 + i * s * 0.13);
        ctx.bezierCurveTo(-s * 0.1, -s * 0.28 + i * s * 0.13, s * 0.12, -s * 0.04 + i * s * 0.13, s * 0.34, -s * 0.16 + i * s * 0.13);
        ctx.stroke();
      }
      ctx.fillStyle = '#3f9e4d';
      circle(ctx, -s * 0.2, -s * 0.2, s * 0.05);
      circle(ctx, s * 0.18, s * 0.18, s * 0.05);
      break;
    }
    case 'telur-orak': {
      ctx.fillStyle = '#ffd23e';
      ellipse(ctx, -s * 0.12, s * 0.02, s * 0.26, s * 0.18);
      ellipse(ctx, s * 0.16, -s * 0.06, s * 0.22, s * 0.16);
      ctx.fillStyle = '#f2a007';
      ellipse(ctx, s * 0.02, s * 0.12, s * 0.2, s * 0.1);
      break;
    }
    case 'tahu-crispy': {
      ctx.fillStyle = '#e8a83c';
      ctx.fillRect(-s * 0.32, -s * 0.2, s * 0.28, s * 0.4);
      ctx.fillRect(s * 0.02, -s * 0.24, s * 0.28, s * 0.4);
      ctx.fillStyle = '#c9821e';
      ctx.fillRect(-s * 0.32, s * 0.08, s * 0.28, s * 0.12);
      ctx.fillRect(s * 0.02, s * 0.04, s * 0.28, s * 0.12);
      ctx.fillStyle = '#fff3d6';
      circle(ctx, -s * 0.18, -s * 0.08, s * 0.04);
      circle(ctx, s * 0.16, -s * 0.12, s * 0.04);
      break;
    }
    case 'sate-matang': {
      ctx.strokeStyle = '#d9b96a';
      ctx.lineWidth = s * 0.05;
      for (const dy of [-s * 0.14, s * 0.12]) {
        ctx.beginPath(); ctx.moveTo(-s * 0.4, dy); ctx.lineTo(s * 0.42, dy); ctx.stroke();
      }
      ctx.fillStyle = '#8a4a1a';
      for (const dy of [-s * 0.14, s * 0.12]) {
        for (let i = 0; i < 3; i++) {
          circle(ctx, -s * 0.24 + i * s * 0.24, dy, s * 0.11);
        }
      }
      ctx.fillStyle = '#c98d4b';
      circle(ctx, -s * 0.24, -s * 0.14, s * 0.045);
      circle(ctx, 0, s * 0.12, s * 0.045);
      break;
    }
    case 'ayam-bakar': {
      ctx.fillStyle = '#8a3d12';
      ellipse(ctx, -s * 0.05, s * 0.02, s * 0.32, s * 0.26);
      ctx.fillStyle = '#b25a1e';
      ellipse(ctx, -s * 0.12, -s * 0.1, s * 0.2, s * 0.16);
      ctx.fillStyle = '#5a2d12';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-s * 0.28 + i * s * 0.18, -s * 0.18, s * 0.05, s * 0.3);
      }
      ctx.fillStyle = '#f7e8d8';
      circle(ctx, s * 0.32, s * 0.22, s * 0.09);
      ctx.strokeStyle = '#f7e8d8';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.1); ctx.lineTo(s * 0.34, s * 0.24); ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = '#c0392b';
      circle(ctx, 0, 0, s * 0.3);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(s * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, s * 0.14);
    }
  }
  ctx.restore();
}

// Draw a finished dish on a plate, for the order tickets and the pass.
export function drawDish(ctx, recipeId, x, y, size) {
  const s = size;
  plate(ctx, x, y, s * 0.5);
  switch (recipeId) {
    case 'nasi-goreng':
      drawItem(ctx, 'nasi-goreng', x, y - s * 0.04, s * 0.62);
      drawItem(ctx, 'telur-orak', x + s * 0.22, y + s * 0.16, s * 0.34);
      break;
    case 'mie-goreng':
      drawItem(ctx, 'mie-goreng', x, y - s * 0.02, s * 0.66);
      drawItem(ctx, 'sayur-potong', x + s * 0.24, y + s * 0.14, s * 0.3);
      break;
    case 'sate-ayam':
      drawItem(ctx, 'sate-matang', x, y - s * 0.02, s * 0.68);
      drawItem(ctx, 'kacang', x + s * 0.26, y + s * 0.16, s * 0.36);
      break;
    case 'ayam-bakar':
      drawItem(ctx, 'ayam-bakar', x, y - s * 0.02, s * 0.62);
      drawItem(ctx, 'sambal', x + s * 0.26, y + s * 0.16, s * 0.36);
      break;
    case 'tahu-crispy':
      drawItem(ctx, 'tahu-crispy', x, y - s * 0.02, s * 0.62);
      drawItem(ctx, 'sambal', x + s * 0.26, y + s * 0.16, s * 0.36);
      break;
    default:
      drawItem(ctx, 'nasi', x, y, s * 0.6);
  }
}
