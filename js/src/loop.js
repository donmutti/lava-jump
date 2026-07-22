import {updatePlayer} from './systems/physics';
import {updateCamera} from './systems/camera';
import {advanceCutscene} from './systems/lifecycle';
import {updateHud} from './dom/hud';
import {render} from './render';

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
      updatePlayer(ctx, dt);
      updateCamera(ctx);
    }

    if (!game.cutscene) {
      updateHud(scene, game);
    }
    render(scene.ctx, game);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
