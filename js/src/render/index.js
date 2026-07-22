import { drawBackground } from './background';
import { drawPlatforms, drawPits, drawGoal, drawPlayer, drawForegroundHints } from './entities';

export function render(c, game) {
  drawBackground(c, game);
  drawPlatforms(c, game);
  drawPits(c, game);
  drawGoal(c, game);
  drawPlayer(c, game);
  drawForegroundHints(c);
}
