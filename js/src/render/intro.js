import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/constants';

// Sunny Meadow palette, mirrored from THEME.FIELD so the opening reads as
// "home" — the same place level 1 starts.
const SKY_TOP = '#7ec8e3';
const SKY_BOTTOM = '#dff3d8';
const HILL_FAR = '#9fc98a';
const HILL_NEAR = '#5c9450';
const GRASS = '#6cae54';
const SUN_CORE = '#fff3b0';
const SUN_GLOW = 'rgba(255, 236, 160, 0.4)';

const GROUND_Y = 420;

// Beat timings (seconds). The cow floats up the beam, then the UFO leaves.
const UFO_ENTER = 1.4;
const UFO_HOVER = 2.4;
const BEAM_ON = 2.6;
const LIFT_START = 3.0;
const LIFT_END = 4.3;
const UFO_EXIT = 4.4;

const COW_X = 640;
const UFO_TOP_Y = -120;
const UFO_HOVER_Y = 120;

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function easeInOut(v) {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function renderIntro(c, t) {
  drawSky(c);
  drawSun(c, t);
  drawHills(c);
  drawGround(c);
  drawHouse(c, 200);
  drawChicken(c, 340, t);

  const ufoProgress = easeInOut(clamp01((t - UFO_ENTER) / (UFO_HOVER - UFO_ENTER)));
  let ufoY = lerp(UFO_TOP_Y, UFO_HOVER_Y, ufoProgress);
  if (t > UFO_EXIT) {
    const exit = easeInOut(clamp01((t - UFO_EXIT) / 1.4));
    ufoY = lerp(UFO_HOVER_Y, UFO_TOP_Y, exit);
  }

  const lift = easeInOut(clamp01((t - LIFT_START) / (LIFT_END - LIFT_START)));
  const cowRestY = GROUND_Y - 34;
  const cowLiftedY = ufoY + 66;
  const cowY = lerp(cowRestY, cowLiftedY, lift);
  const cowGone = t > UFO_EXIT && lift >= 1;

  if (t > BEAM_ON) {
    drawBeam(c, COW_X, ufoY + 34, cowY, t);
  }
  if (!cowGone) {
    drawCow(c, COW_X, cowY, lift);
  }
  drawUfo(c, COW_X, ufoY, t);
}

function drawSky(c) {
  const g = c.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(1, SKY_BOTTOM);
  c.fillStyle = g;
  c.fillRect(0, 0, VIEWPORT_WIDTH, GROUND_Y);
}

function drawSun(c, t) {
  const cx = 810;
  const cy = 96 + Math.sin(t * 0.6) * 3;
  c.save();
  c.fillStyle = SUN_GLOW;
  c.beginPath();
  c.arc(cx, cy, 64, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = SUN_CORE;
  c.beginPath();
  c.arc(cx, cy, 34, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawHills(c) {
  drawHillBand(c, HILL_FAR, GROUND_Y - 40, 120, 0);
  drawHillBand(c, HILL_NEAR, GROUND_Y - 10, 90, 220);
}

function drawHillBand(c, color, baseY, amp, phase) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEWPORT_WIDTH; x += 20) {
    const y = baseY - Math.sin((x + phase) * 0.006) * amp * 0.5 - amp * 0.5;
    c.lineTo(x, y);
  }
  c.lineTo(VIEWPORT_WIDTH, GROUND_Y);
  c.closePath();
  c.fill();
}

function drawGround(c) {
  c.fillStyle = GRASS;
  c.fillRect(0, GROUND_Y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT - GROUND_Y);
  c.fillStyle = '#5a9648';
  c.fillRect(0, GROUND_Y, VIEWPORT_WIDTH, 6);
}

function drawHouse(c, x) {
  const y = GROUND_Y - 92;
  // walls
  c.fillStyle = '#e8d6b0';
  c.fillRect(x, y + 40, 120, 52);
  // roof
  c.fillStyle = '#b1503a';
  c.beginPath();
  c.moveTo(x - 12, y + 40);
  c.lineTo(x + 60, y);
  c.lineTo(x + 132, y + 40);
  c.closePath();
  c.fill();
  // door
  c.fillStyle = '#6f4a2f';
  c.fillRect(x + 48, y + 60, 24, 32);
  // window
  c.fillStyle = '#8fd0e6';
  c.fillRect(x + 20, y + 54, 18, 18);
  c.fillRect(x + 82, y + 54, 18, 18);
}

function drawChicken(c, x, t) {
  const y = GROUND_Y - 46;
  const bob = Math.sin(t * 4) * 1.5;
  c.save();
  c.translate(x, y + bob);
  // shadow
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.fillRect(2, 44, 26, 6);
  // body
  c.fillStyle = '#ffe082';
  c.fillRect(4, 8, 22, 26);
  c.fillRect(8, 0, 14, 12);
  // legs
  c.fillStyle = '#ff9671';
  c.fillRect(9, 34, 5, 12);
  c.fillRect(18, 34, 5, 12);
  // beak
  c.fillStyle = '#ff9671';
  c.fillRect(22, 4, 6, 4);
  // eye
  c.fillStyle = '#1f2236';
  c.fillRect(17, 3, 3, 3);
  // comb
  c.fillStyle = '#e2483a';
  c.fillRect(10, -4, 10, 4);
  c.restore();
}

function drawCow(c, x, y, lift) {
  c.save();
  c.translate(x, y);
  if (lift < 0.05) {
    c.fillStyle = 'rgba(0,0,0,0.16)';
    c.fillRect(-24, 32, 52, 6);
  }
  // body — cute, slightly bigger than the chicken
  c.fillStyle = '#f4f0ea';
  c.fillRect(-26, -6, 52, 34);
  // head
  c.fillRect(18, -2, 20, 20);
  // legs
  c.fillStyle = '#d9d2c6';
  c.fillRect(-20, 28, 7, 10);
  c.fillRect(-4, 28, 7, 10);
  c.fillRect(12, 28, 7, 10);
  // spots
  c.fillStyle = '#3a3330';
  c.fillRect(-18, 2, 12, 10);
  c.fillRect(2, 10, 14, 12);
  // snout
  c.fillStyle = '#f2b8c6';
  c.fillRect(30, 10, 10, 8);
  // eye
  c.fillStyle = '#1f2236';
  c.fillRect(26, 2, 3, 3);
  // ear
  c.fillStyle = '#f4f0ea';
  c.fillRect(16, -6, 8, 6);
  c.restore();
}

function drawBeam(c, x, topY, bottomY, t) {
  const flicker = 0.5 + Math.sin(t * 14) * 0.06;
  const g = c.createLinearGradient(0, topY, 0, bottomY);
  g.addColorStop(0, `rgba(160, 240, 255, ${0.55 * flicker})`);
  g.addColorStop(1, 'rgba(160, 240, 255, 0.05)');
  c.save();
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 16, topY);
  c.lineTo(x + 16, topY);
  c.lineTo(x + 46, bottomY);
  c.lineTo(x - 46, bottomY);
  c.closePath();
  c.fill();
  c.restore();
}

function drawUfo(c, x, y, t) {
  c.save();
  c.translate(x, y);
  // glow under the dome
  c.fillStyle = 'rgba(160, 240, 255, 0.25)';
  c.beginPath();
  c.ellipse(0, 18, 64, 20, 0, 0, Math.PI * 2);
  c.fill();
  // saucer body
  c.fillStyle = '#9aa7c4';
  c.beginPath();
  c.ellipse(0, 14, 58, 18, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#6f7c9c';
  c.beginPath();
  c.ellipse(0, 20, 58, 12, 0, 0, Math.PI * 2);
  c.fill();
  // dome
  c.fillStyle = '#bfe8f5';
  c.beginPath();
  c.ellipse(0, 6, 28, 22, 0, Math.PI, 0);
  c.fill();
  // running lights
  const lights = 5;
  for (let i = 0; i < lights; i += 1) {
    const on = (Math.floor(t * 6) + i) % lights === 0;
    c.fillStyle = on ? '#fff6a0' : '#4de0ff';
    const lx = -44 + (i * 88) / (lights - 1);
    c.beginPath();
    c.arc(lx, 20, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
