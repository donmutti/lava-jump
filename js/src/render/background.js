import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH, COLORS } from '../config/constants.js';

export function drawBackground(c, game) {
  const gradient = c.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(1, COLORS.skyBottom);
  c.fillStyle = gradient;
  c.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  drawMoon(c);
  drawMountainLayer(c, game, 0.14, 345, COLORS.mountainFar, 0.72, 190, 1.7, false);
  drawMistBand(c, game, 96, 56, 0.08);
  drawMountainLayer(c, game, 0.24, 410, COLORS.mountainMid, 0.88, 150, 2.3, true);
  drawMistBand(c, game, 210, 80, 0.16);
  drawMountainLayer(c, game, 0.36, 475, COLORS.mountainNear, 1, 120, 3.1, true);

  c.fillStyle = 'rgba(240, 232, 250, 0.18)';
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 140) - game.camera.x * 0.06) % (VIEWPORT_WIDTH + 120) - 60;
    const y = 72 + (i % 4) * 30;
    c.beginPath();
    c.arc(x, y, 1.8 + (i % 3), 0, Math.PI * 2);
    c.fill();
  }
}

export function drawMoon(c) {
  const glow = c.createRadialGradient(760, 92, 10, 760, 92, 88);
  glow.addColorStop(0, COLORS.moonGlow);
  glow.addColorStop(1, 'rgba(255, 236, 224, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(760, 92, 88, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = COLORS.moonCore;
  c.beginPath();
  c.arc(760, 92, 28, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(58, 37, 64, 0.18)';
  c.beginPath();
  c.arc(748, 86, 7, 0, Math.PI * 2);
  c.arc(770, 102, 5, 0, Math.PI * 2);
  c.fill();
}

export function drawMistBand(c, game, y, height, parallax) {
  c.save();
  c.translate(-game.camera.x * parallax, 0);
  const mist = c.createLinearGradient(0, y, 0, y + height);
  mist.addColorStop(0, 'rgba(226, 214, 236, 0)');
  mist.addColorStop(0.5, COLORS.mist);
  mist.addColorStop(1, 'rgba(226, 214, 236, 0)');
  c.fillStyle = mist;
  c.fillRect(-120, y, WORLD_WIDTH + 240, height);
  c.restore();
}

export function drawMountainLayer(c, game, parallax, baseY, ridgeColor, scale, peakHeight, spacing, snowCaps) {
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
    c.fillStyle = COLORS.mountainSnow;
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
