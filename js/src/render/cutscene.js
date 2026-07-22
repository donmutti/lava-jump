import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../config/constants';
import { renderIntro } from './intro';
import { renderOutro } from './outro';

const BAR_HEIGHT = 64;

export function renderCutscene(c, game) {
  const scene = game.cutscene;
  if (!scene) {
    return;
  }

  if (scene.name === 'intro') {
    renderIntro(c, scene.t);
  } else if (scene.name === 'ending') {
    renderOutro(c, scene.t);
  } else {
    c.fillStyle = '#05040a';
    c.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  }

  drawLetterbox(c, scene.t);
}

function drawLetterbox(c, t) {
  const grow = Math.min(1, t / 0.4);
  const h = BAR_HEIGHT * grow;
  c.fillStyle = '#000';
  c.fillRect(0, 0, VIEWPORT_WIDTH, h);
  c.fillRect(0, VIEWPORT_HEIGHT - h, VIEWPORT_WIDTH, h);
}

