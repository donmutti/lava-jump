import {updatePlayer} from './systems/physics';
import {updateCamera} from './systems/camera';
import {advanceCutscene, triggerTimeUp} from './systems/lifecycle';
import {updateHud} from './dom/hud';
import {render} from './render';
import {TIME_LIMIT} from './config/constants';

export function startLoop(ctx) {
  const {game, scene} = ctx;

  function tick(now) {
    const dt = Math.min((now - game.lastFrame) / 1000, 1 / 30);
    game.lastFrame = now;
    game.lavaPhase += dt;

    if (game.cutscene) {
      advanceCutscene(ctx, dt);
    } else if (game.state === 'playing') {
      game.timer += dt;
      if (game.timer >= TIME_LIMIT) {
        game.timer = TIME_LIMIT;
        triggerTimeUp(ctx);
      } else {
        updatePlayer(ctx, dt);
        updateCamera(ctx);
      }
    }

    if (!game.cutscene) {
      updateHud(scene, game);
    }
    render(scene.ctx, game);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
