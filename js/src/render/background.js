import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH } from '../config/constants';
import { LEVELS } from '../config/level';

export function drawBackground(c, game) {
  const theme = LEVELS[game.levelIndex].theme;

  const gradient = c.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  c.fillStyle = gradient;
  c.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  drawCelestial(c, theme);

  if (theme.silhouette === 'asteroids') {
    drawStarfield(c, game, theme);
    drawAsteroidLayer(c, game, 0.1, theme.ridgeFar, 26, 0.00013);
    drawAsteroidLayer(c, game, 0.22, theme.ridgeMid, 44, 0.00021);
    drawAsteroidLayer(c, game, 0.34, theme.ridgeNear, 70, 0.00009);
  } else if (theme.silhouette === 'cave') {
    drawCaveCeiling(c, game, theme);
    drawTerrainLayer(c, game, 0.24, 410, theme.ridgeMid, 0.88, 150, 2.3, false, theme);
    drawMistBand(c, game, 210, 80, 0.16, theme);
    drawTerrainLayer(c, game, 0.36, 475, theme.ridgeNear, 1, 120, 3.1, false, theme);
  } else {
    drawTerrainLayer(c, game, 0.14, 345, theme.ridgeFar, 0.72, 190, 1.7, false, theme);
    drawMistBand(c, game, 96, 56, 0.08, theme);
    drawTerrainLayer(c, game, 0.24, 410, theme.ridgeMid, 0.88, 150, 2.3, theme.snowCaps, theme);
    drawMistBand(c, game, 210, 80, 0.16, theme);
    drawTerrainLayer(c, game, 0.36, 475, theme.ridgeNear, 1, 120, 3.1, theme.snowCaps, theme);
  }

  c.fillStyle = theme.particle;
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 140) - game.camera.x * 0.06) % (VIEWPORT_WIDTH + 120) - 60;
    const y = 72 + (i % 4) * 30;
    c.beginPath();
    c.arc(x, y, 1.8 + (i % 3), 0, Math.PI * 2);
    c.fill();
  }
}

export function drawCelestial(c, theme) {
  const glow = c.createRadialGradient(760, 92, 10, 760, 92, 88);
  glow.addColorStop(0, theme.celestialGlow);
  glow.addColorStop(1, 'rgba(255, 236, 224, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(760, 92, 88, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = theme.celestialCore;
  c.beginPath();
  c.arc(760, 92, 28, 0, Math.PI * 2);
  c.fill();

  if (theme.celestial === 'sun') {
    c.strokeStyle = theme.celestialCore;
    c.lineWidth = 3;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      c.beginPath();
      c.moveTo(760 + Math.cos(a) * 36, 92 + Math.sin(a) * 36);
      c.lineTo(760 + Math.cos(a) * 46, 92 + Math.sin(a) * 46);
      c.stroke();
    }
  } else {
    c.fillStyle = 'rgba(58, 37, 64, 0.18)';
    c.beginPath();
    c.arc(748, 86, 7, 0, Math.PI * 2);
    c.arc(770, 102, 5, 0, Math.PI * 2);
    c.fill();
  }
}

export function drawMistBand(c, game, y, height, parallax, theme) {
  c.save();
  c.translate(-game.camera.x * parallax, 0);
  const mist = c.createLinearGradient(0, y, 0, y + height);
  mist.addColorStop(0, 'rgba(226, 214, 236, 0)');
  mist.addColorStop(0.5, theme.mist);
  mist.addColorStop(1, 'rgba(226, 214, 236, 0)');
  c.fillStyle = mist;
  c.fillRect(-120, y, WORLD_WIDTH + 240, height);
  c.restore();
}

function drawTerrainLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing, snowCaps, theme) {
  if (theme.silhouette === 'trees') {
    drawTreeLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing);
  } else {
    drawMountainLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing, snowCaps, theme);
  }
}

function drawTreeLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing) {
  c.save();
  c.translate(-game.camera.x * parallax, 0);

  const step = 220 * (spacing / 2.3);
  const treeStep = step * 0.34;
  const height = peakHeight * scale * 0.9;
  const halfWidth = treeStep * 0.42;
  c.fillStyle = ridgeColor;

  // ground band under the treeline
  c.fillRect(-260, baseY, WORLD_WIDTH + 560, VIEWPORT_HEIGHT + 40 - baseY);

  for (let x = -260; x <= WORLD_WIDTH + 300; x += treeStep) {
    const jitter = Math.sin(x * 0.021 + parallax * 11) * 0.5 + 0.5;
    const h = height * (0.6 + jitter * 0.5);
    const tipY = baseY - h;
    // stacked triangular conifer tiers
    for (let tier = 0; tier < 3; tier += 1) {
      const t = tier / 3;
      const tierTop = tipY + h * t * 0.72;
      const tierBottom = baseY - h * 0.12 * (2 - tier);
      const w = halfWidth * (0.5 + t);
      c.beginPath();
      c.moveTo(x, tierTop);
      c.lineTo(x - w, tierBottom);
      c.lineTo(x + w, tierBottom);
      c.closePath();
      c.fill();
    }
  }

  c.restore();
}

function drawCaveCeiling(c, game, theme) {
  const parallax = 0.14;
  c.save();
  c.translate(-game.camera.x * parallax, 0);

  const ceilingBase = 120;
  c.fillStyle = theme.ridgeFar;
  c.beginPath();
  c.moveTo(-260, -40);
  c.lineTo(WORLD_WIDTH + 300, -40);

  // bumpy rock underside of the ceiling
  for (let x = WORLD_WIDTH + 300; x >= -260; x -= 90) {
    const bump = Math.sin(x * 0.03) * 14 + Math.sin(x * 0.011) * 20;
    c.lineTo(x, ceilingBase + bump);
  }
  c.closePath();
  c.fill();

  // hanging stalactites
  c.fillStyle = theme.ridgeMid;
  const step = 150;
  for (let x = -200; x <= WORLD_WIDTH + 300; x += step) {
    const jitter = Math.sin(x * 0.017 + 3) * 0.5 + 0.5;
    const len = 60 + jitter * 90;
    const half = 16 + jitter * 10;
    const topY = ceilingBase + Math.sin(x * 0.03) * 14;
    c.beginPath();
    c.moveTo(x - half, topY);
    c.lineTo(x + half, topY);
    c.lineTo(x, topY + len);
    c.closePath();
    c.fill();
  }

  c.restore();
}

function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function drawStarfield(c, game, theme) {
  for (let i = 0; i < 90; i += 1) {
    const parallax = 0.02 + (i % 3) * 0.02;
    const spanX = WORLD_WIDTH + VIEWPORT_WIDTH;
    const x = (hash(i) * spanX - game.camera.x * parallax) % spanX;
    const px = x < 0 ? x + spanX : x;
    const y = hash(i + 99) * VIEWPORT_HEIGHT;
    const twinkle = 0.5 + 0.5 * Math.sin(game.lavaPhase * 2 + i);
    const r = 0.5 + hash(i + 7) * 1.4;
    c.fillStyle = `rgba(220, 200, 255, ${0.3 + twinkle * 0.5})`;
    c.beginPath();
    c.arc(px, y, r, 0, Math.PI * 2);
    c.fill();
  }
}

function drawAsteroidLayer(c, game, parallax, color, size, seed) {
  c.save();
  const spanX = WORLD_WIDTH + VIEWPORT_WIDTH * 2;
  const count = Math.round(spanX / (size * 9));
  c.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const drift = game.lavaPhase * 6 * parallax;
    const baseX = hash(i * 13.7 + seed * 1e5) * spanX;
    const raw = (baseX - game.camera.x * parallax - drift) % spanX;
    const x = (raw < 0 ? raw + spanX : raw) - VIEWPORT_WIDTH;
    const y = hash(i * 7.3 + seed * 2e5) * (VIEWPORT_HEIGHT - 40) + 20;
    const r = size * (0.6 + hash(i + 3) * 0.7);

    if (x < -r || x > VIEWPORT_WIDTH + r) {
      continue;
    }

    const verts = 8;
    c.beginPath();
    for (let v = 0; v <= verts; v += 1) {
      const a = (v / verts) * Math.PI * 2;
      const wobble = 0.7 + hash(i * 5 + v) * 0.5;
      const rr = r * wobble;
      const vx = x + Math.cos(a) * rr;
      const vy = y + Math.sin(a) * rr * 0.85;
      if (v === 0) {
        c.moveTo(vx, vy);
      } else {
        c.lineTo(vx, vy);
      }
    }
    c.closePath();
    c.fill();

    // a couple of craters for texture
    c.fillStyle = 'rgba(0, 0, 0, 0.22)';
    c.beginPath();
    c.arc(x - r * 0.25, y - r * 0.1, r * 0.22, 0, Math.PI * 2);
    c.arc(x + r * 0.3, y + r * 0.25, r * 0.15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
  }
  c.restore();
}

export function drawMountainLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing, snowCaps, theme) {
  c.save();
  c.translate(-game.camera.x * parallax, 0);

  const step = 220 * (spacing / 2.3);
  c.fillStyle = ridgeColor;
  c.beginPath();
  c.moveTo(-260, VIEWPORT_HEIGHT + 40);
  c.lineTo(-260, baseY);

  const peaks = [];
  for (let x = -260; x <= WORLD_WIDTH + 300; x += step) {
    const jitter = Math.sin(x * 0.006 + parallax * 17) * 0.5 + Math.sin(x * 0.013 + parallax * 5) * 0.5;
    const peakY = baseY - (peakHeight * scale) * (0.55 + Math.abs(jitter) * 0.45);
    const midX = x + step / 2;
    c.lineTo(x, baseY - 8);
    c.lineTo(midX, peakY);
    peaks.push({ x: midX, y: peakY });
  }

  c.lineTo(WORLD_WIDTH + 300, baseY);
  c.lineTo(WORLD_WIDTH + 300, VIEWPORT_HEIGHT + 40);
  c.closePath();
  c.fill();

  if (snowCaps) {
    c.fillStyle = theme.snow;
    const capWidth = step * 0.16;
    const capDrop = peakHeight * scale * 0.12;
    for (const peak of peaks) {
      c.beginPath();
      c.moveTo(peak.x, peak.y);
      c.lineTo(peak.x - capWidth, peak.y + capDrop);
      c.lineTo(peak.x + capWidth, peak.y + capDrop);
      c.closePath();
      c.fill();
    }
  }

  c.restore();
}
