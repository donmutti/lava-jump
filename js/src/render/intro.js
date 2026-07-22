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
const CHASE_START = 2.8; // the chicken pauses a beat before bolting after the cow
const CHASE_END = 4.2; // and stops short of the saucer's exit (UFO_EXIT - 0.2)
const LIFT_START = 3.4; // the beam holds the cow briefly before it starts lifting
const LIFT_END = 4.3;
const UFO_EXIT = 4.4;
const EXIT_DUR = 1.6; // how long the UFO takes to climb and slide off-screen

const COW_X = 640;
const UFO_TOP_Y = -120;
const UFO_HOVER_Y = 120;
const UFO_EXIT_X = VIEWPORT_WIDTH + 160; // saucer slides off to the right as it leaves

const CHICKEN_HOME_X = 340; // where the chicken starts, beside the house

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function easeInOut(v) {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export const SCENE = { GROUND_Y, COW_X };

export function renderIntro(c, t) {
  drawSky(c);
  drawSun(c, t);
  drawHills(c);
  drawGround(c);
  drawHouse(c, 200);

  const ufoProgress = easeInOut(clamp01((t - UFO_ENTER) / (UFO_HOVER - UFO_ENTER)));
  let ufoY = lerp(UFO_TOP_Y, UFO_HOVER_Y, ufoProgress);
  let ufoX = COW_X;
  if (t > UFO_EXIT) {
    const exit = easeInOut(clamp01((t - UFO_EXIT) / EXIT_DUR));
    ufoY = lerp(UFO_HOVER_Y, UFO_TOP_Y, exit);
    ufoX = lerp(COW_X, UFO_EXIT_X, exit);
  }

  const lift = easeInOut(clamp01((t - LIFT_START) / (LIFT_END - LIFT_START)));
  const cowRestY = GROUND_Y - 34;
  const cowLiftedY = ufoY + 66;
  const cowY = lerp(cowRestY, cowLiftedY, lift);
  const cowX = lerp(COW_X, ufoX, lift);
  const cowGone = ufoX > VIEWPORT_WIDTH + 80;

  // The chicken bolts from the house the instant the beam grabs the cow and
  // runs to where the COW is — the spot she was taken from (COW_X), directly
  // beneath her, never farther. He's chasing the cow, not the UFO that slides
  // away overhead, so he stops under her last ground position and reaches up.
  const chase = clamp01((t - CHASE_START) / (CHASE_END - CHASE_START));
  const chaseTarget = lerp(CHICKEN_HOME_X, COW_X, easeInOut(chase));
  const chickenX = Math.min(Math.max(CHICKEN_HOME_X, chaseTarget), COW_X);
  const running = t > CHASE_START && t < CHASE_END && !cowGone;
  // A last desperate leaping lunge — launched while still finishing the run
  // (before CHASE_END) so it reads as a running leap, not a stop-then-jump.
  const lungeWindow = clamp01((t - (CHASE_END - 0.6)) / 0.4);
  const lunge = running ? Math.sin(lungeWindow * Math.PI) : 0;
  // The chicken cranes its head up to watch the saucer — once as it arrives
  // and descends, and again as it climbs away with the cow.
  const lookOnArrival = clamp01((t - UFO_ENTER) / 0.4) * (1 - clamp01((t - UFO_HOVER) / 0.4));
  const lookOnExit = clamp01((t - UFO_EXIT) / 0.3);
  const lookUp = cowGone ? 0 : Math.max(lookOnArrival, lookOnExit);

  if (t > BEAM_ON && !cowGone) {
    drawBeam(c, cowX, ufoY + 34, cowY, t);
  }
  if (!cowGone) {
    drawCow(c, cowX, cowY, lift);
  }
  drawUfo(c, ufoX, ufoY, t);

  drawChicken(c, chickenX, t, running, lunge, lookUp);
}

export function drawSky(c) {
  const g = c.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(1, SKY_BOTTOM);
  c.fillStyle = g;
  c.fillRect(0, 0, VIEWPORT_WIDTH, GROUND_Y);
}

export function drawSun(c, t) {
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

export function drawHills(c) {
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

export function drawGround(c) {
  c.fillStyle = GRASS;
  c.fillRect(0, GROUND_Y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT - GROUND_Y);
  c.fillStyle = '#5a9648';
  c.fillRect(0, GROUND_Y, VIEWPORT_WIDTH, 6);
}

export function drawHouse(c, x) {
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

export function drawChicken(c, x, t, running, lunge, lookUp = 0, walking = false, faceLeft = false) {
  // Running: fast vertical bob and a forward lean; lunge lifts it off the
  // ground and stretches it toward the fleeing cow. Walking is a calmer,
  // slower stride used for the homecoming (legs move, wings stay tucked).
  const strideActive = running || walking;
  const gait = running ? Math.sin(t * 18) : walking ? Math.sin(t * 9) : Math.sin(t * 4);
  const bob = running ? Math.abs(gait) * -4 : walking ? Math.abs(gait) * -2 : gait * 1.5;
  const lift = lunge * 22;
  const lean = (running ? 0.22 : 0) + lunge * 0.35;
  const y = GROUND_Y - 46;

  c.save();
  c.translate(x, y + bob - lift);
  if (faceLeft) {
    // mirror around the body's center so the bird faces left when walking home
    c.translate(15, 0);
    c.scale(-1, 1);
    c.translate(-15, 0);
  }
  // shadow — spreads and fades as it leaps
  c.fillStyle = `rgba(0,0,0,${0.18 - lunge * 0.1})`;
  c.fillRect(2 - lunge * 4, 44 + lift, 26 + lunge * 8, 6);
  // lean the whole bird forward toward the cow
  c.translate(15, 24);
  c.rotate(lean);
  c.translate(-15, -24);
  // body
  c.fillStyle = '#ffe082';
  c.fillRect(4, 8, 22, 26);
  // wing — pinned up in alarm while chasing, flapping
  c.fillStyle = '#f6c948';
  if (running) {
    const flap = Math.sin(t * 22) * 6;
    c.save();
    c.translate(6, 12);
    c.rotate(-0.5 - lunge * 0.4);
    c.fillRect(-3, -14 - flap, 8, 18);
    c.restore();
  } else {
    c.fillRect(4, 12, 7, 16);
  }
  // legs — pumping stride when running or walking (split apart), planted otherwise
  c.fillStyle = '#ff9671';
  if (strideActive) {
    const stride = gait * 7;
    c.save();
    c.translate(11, 34);
    c.rotate(stride * 0.03);
    c.fillRect(-2, 0, 5, 13);
    c.restore();
    c.save();
    c.translate(20, 34);
    c.rotate(-stride * 0.03);
    c.fillRect(-2, 0, 5, 13);
    c.restore();
  } else {
    c.fillRect(9, 34, 5, 12);
    c.fillRect(18, 34, 5, 12);
  }
  // head cluster — cranes upward to watch the UFO. Pivots at the neck so the
  // beak lifts toward the sky, comb tips back, eye rides higher.
  c.save();
  c.translate(15, 6);
  c.rotate(-lookUp * 0.6);
  c.translate(-15, -6);
  // head
  c.fillStyle = '#ffe082';
  c.fillRect(8, 0, 14, 12);
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
  c.restore();
}

export function drawCow(c, x, y, lift, faceLeft = false) {
  c.save();
  c.translate(x, y);
  if (faceLeft) {
    c.scale(-1, 1);
  }
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
