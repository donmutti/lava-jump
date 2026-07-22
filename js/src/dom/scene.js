import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/constants.js';

export function buildScene(root) {
  if (!root) {
    throw new Error('Missing #game-root mount point.');
  }

  const frame = document.createElement('section');
  frame.className = 'game-frame';

  const hud = document.createElement('div');
  hud.className = 'hud';

  const stats = document.createElement('div');
  stats.className = 'hud-stats';

  const checkpointStat = document.createElement('div');
  checkpointStat.className = 'hud-pill';

  const deathStat = document.createElement('div');
  deathStat.className = 'hud-pill';

  const timeStat = document.createElement('div');
  timeStat.className = 'hud-pill';

  stats.append(checkpointStat, deathStat, timeStat);

  const statusLabel = document.createElement('div');
  statusLabel.className = 'hud-pill';

  hud.append(stats, statusLabel);

  const canvasShell = document.createElement('div');
  canvasShell.className = 'canvas-shell';

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = VIEWPORT_WIDTH * dpr;
  canvas.height = VIEWPORT_HEIGHT * dpr;
  canvas.setAttribute('aria-label', 'Lava Jump platformer');
  canvas.setAttribute('role', 'img');
  canvas.tabIndex = 0;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const overlayCard = document.createElement('div');
  overlayCard.className = 'overlay-card';

  const overlayTitle = document.createElement('h2');
  const overlayMessage = document.createElement('p');

  overlayCard.append(overlayTitle, overlayMessage);
  overlay.append(overlayCard);
  canvasShell.append(canvas, overlay);
  frame.append(hud, canvasShell);
  root.append(frame);

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context.');
  }

  ctx.scale(dpr, dpr);

  return {
    canvas,
    ctx,
    overlay,
    overlayTitle,
    overlayMessage,
    checkpointStat,
    deathStat,
    timeStat,
    statusLabel,
  };
}
