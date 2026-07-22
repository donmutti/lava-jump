import { drawBackground } from './background';
import { drawPlatforms, drawPits, drawGoal, drawPlayer, drawForegroundHints } from './entities';
import { renderCutscene } from './cutscene';

export function render(c, game) {
  if (game.cutscene) {
    renderCutscene(c, game);
    return;
  }

  drawBackground(c, game);
  drawPlatforms(c, game);
  drawPits(c, game);
  drawGoal(c, game);
  drawPlayer(c, game);
  drawForegroundHints(c);
}
