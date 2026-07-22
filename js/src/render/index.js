import { drawBackground } from './background.js';
import { drawPlatforms, drawLava, drawGoal, drawPlayer, drawForegroundHints } from './entities.js';

export function render(c, game) {
  drawBackground(c, game);
  drawPlatforms(c, game);
  drawLava(c, game);
  drawGoal(c, game);
  drawPlayer(c, game);
  drawForegroundHints(c);
}
