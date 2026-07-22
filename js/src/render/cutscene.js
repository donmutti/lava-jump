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
}

function drawLetterbox(c, t) {
  const grow = Math.min(1, t / 0.4);
  const h = BAR_HEIGHT * grow;
  c.fillStyle = '#000';
  c.fillRect(0, 0, VIEWPORT_WIDTH, h);
  c.fillRect(0, VIEWPORT_HEIGHT - h, VIEWPORT_WIDTH, h);
}

