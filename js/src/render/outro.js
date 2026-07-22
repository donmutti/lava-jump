import { VIEWPORT_WIDTH, COLORS } from '../config/constants';
import {
  clamp01,
  easeInOut,
  lerp,
  SCENE,
  drawSky,
  drawSun,
  drawHills,
  drawGround,
  drawHouse,
  drawChicken,
  drawCow,
} from './intro';

const { GROUND_Y, COW_X } = SCENE;

// Beat timings (seconds). Portal opens where the cow was taken, the pair steps
// out, the portal collapses, and the two walk home before it fades to black.
const PORTAL_OPEN = 0.3;
const PORTAL_FULL = 1.0;
const EMERGE_START = 1.0;
const EMERGE_END = 2.0;
const PORTAL_CLOSE_START = 2.0;
const PORTAL_CLOSE_END = 2.6;
const WALK_START = 2.0;
const WALK_END = 4.2;
const FADE_START = 4.4;
const FADE_END = 5.4;

const PORTAL_X = COW_X; // exactly where the cow was abducted
const PORTAL_GROUND_Y = GROUND_Y - 4;
const HOME_CHICKEN_X = 330; // just right of the house, where the chase began
const HOME_COW_X = 420;

// Deterministic spark directions so the burst looks consistent frame to frame.
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.4;
  return { dx: Math.cos(a), dy: Math.sin(a) - 0.3, len: 20 + (i % 4) * 8 };
});

export function renderOutro(c, t) {
  drawSky(c);
  drawSun(c, t);
  drawHills(c);
  drawGround(c);
  drawHouse(c, 200);

  const portalOpen = easeInOut(clamp01((t - PORTAL_OPEN) / (PORTAL_FULL - PORTAL_OPEN)));
  const portalClose = easeInOut(clamp01((t - PORTAL_CLOSE_START) / (PORTAL_CLOSE_END - PORTAL_CLOSE_START)));
  const portalScale = portalOpen * (1 - portalClose);
  if (portalScale > 0.001) {
    drawPortal(c, PORTAL_X, PORTAL_GROUND_Y, portalScale, t);
  }

  // Sparks scatter outward right as the portal snaps shut.
  const sparkP = clamp01((t - PORTAL_CLOSE_START) / (PORTAL_CLOSE_END - PORTAL_CLOSE_START + 0.3));
  if (sparkP > 0 && sparkP < 1) {
    drawSparks(c, PORTAL_X, PORTAL_GROUND_Y - 40, sparkP);
  }

  // The pair emerges from the portal, then walks home together.
  const emerge = easeInOut(clamp01((t - EMERGE_START) / (EMERGE_END - EMERGE_START)));
  const walk = easeInOut(clamp01((t - WALK_START) / (WALK_END - WALK_START)));

  const chickenStartX = PORTAL_X - 14;
  const cowStartX = PORTAL_X + 6;
  const chickenX = lerp(chickenStartX, HOME_CHICKEN_X, walk);
  const cowX = lerp(cowStartX, HOME_COW_X, walk);

  const emerging = t > EMERGE_START && t < EMERGE_END;
  const walking = t >= WALK_START && walk < 1;
  const cowWalkBob = walking ? Math.abs(Math.sin(t * 8)) * -2 : 0;

  // Fade the pair in as they step out of the portal so they seem to arrive
  // through it rather than pop into existence.
  const appear = clamp01((t - EMERGE_START) / 0.5);
  c.save();
  c.globalAlpha = appear;
  drawCow(c, cowX, GROUND_Y - 34 + cowWalkBob, 0, true);
  drawChicken(c, chickenX - 14, t, false, 0, 0, emerging || walking, true);
  c.restore();

  drawFade(c, t);
}

function drawPortal(c, x, groundY, scale, t) {
  const h = 130 * scale;
  const w = 56 * scale;
  const cy = groundY - h / 2;
  c.save();
  c.translate(x, cy);
  // swirling glow halo — same cyan as the in-game goal portal
  const glow = c.createRadialGradient(0, 0, 4, 0, 0, w * 1.4);
  glow.addColorStop(0, 'rgba(141, 244, 255, 0.55)');
  glow.addColorStop(1, 'rgba(141, 244, 255, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.ellipse(0, 0, w * 1.4, h * 0.7, 0, 0, Math.PI * 2);
  c.fill();
  // portal body — a bright vertical oval that shimmers
  const shimmer = 0.75 + Math.sin(t * 12) * 0.12;
  c.fillStyle = `rgba(141, 244, 255, ${shimmer})`;
  c.beginPath();
  c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COLORS.portalCore;
  c.globalAlpha = shimmer;
  c.beginPath();
  c.ellipse(0, 0, w / 4, h / 2.6, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawSparks(c, x, y, p) {
  c.save();
  const alpha = 1 - p;
  for (const s of SPARKS) {
    const d = p * s.len * 3;
    const sx = x + s.dx * d;
    const sy = y + s.dy * d + p * p * 30; // gentle gravity
    c.fillStyle = `rgba(141, 244, 255, ${alpha})`;
    const size = 4 * (1 - p) + 1;
    c.fillRect(sx - size / 2, sy - size / 2, size, size);
  }
  c.restore();
}

function drawFade(c, t) {
  const fade = clamp01((t - FADE_START) / (FADE_END - FADE_START));
  if (fade <= 0) {
    return;
  }
  c.fillStyle = `rgba(0, 0, 0, ${fade})`;
  c.fillRect(0, 0, VIEWPORT_WIDTH, GROUND_Y + 200);
  // "The End" fades in over the black.
  const textAlpha = clamp01((fade - 0.6) / 0.4);
  if (textAlpha > 0) {
    c.save();
    c.globalAlpha = textAlpha;
    c.fillStyle = '#f4f0ea';
    c.font = '48px Georgia, serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('The End', VIEWPORT_WIDTH / 2, 250);
    c.restore();
  }
}
