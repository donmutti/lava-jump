import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/constants';

const BAR_HEIGHT = 64;

export function renderCutscene(c, game) {
  const scene = game.cutscene;
  if (!scene) {
    return;
  }

  // Empty stage for now: a flat backdrop. Narrative art is layered in later.
  c.fillStyle = '#05040a';
  c.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  drawLetterbox(c, scene.t);
  drawSkipHint(c, scene.t);
}

function drawLetterbox(c, t) {
  const grow = Math.min(1, t / 0.4);
  const h = BAR_HEIGHT * grow;
  c.fillStyle = '#000';
  c.fillRect(0, 0, VIEWPORT_WIDTH, h);
  c.fillRect(0, VIEWPORT_HEIGHT - h, VIEWPORT_WIDTH, h);
}

function drawSkipHint(c, t) {
  const alpha = Math.max(0, Math.min(0.5, (t - 0.6) * 0.8));
  if (alpha <= 0) {
    return;
  }
  c.save();
  c.fillStyle = `rgba(246, 242, 255, ${alpha})`;
  c.font = '600 13px Inter, sans-serif';
  c.textAlign = 'right';
  c.fillText('Press any key to skip', VIEWPORT_WIDTH - 20, VIEWPORT_HEIGHT - 22);
  c.restore();
}
