import { updatePlayer } from './systems/physics.js';
import { updateCamera } from './systems/camera.js';
import { updateHud } from './dom/hud.js';
import { render } from './render/index.js';

export function startLoop(ctx) {
  const { game, scene } = ctx;

  function tick(now) {
    const dt = Math.min((now - game.lastFrame) / 1000, 1 / 30);
    game.lastFrame = now;
    game.lavaPhase += dt;

    if (game.state === 'playing') {
      game.timer += dt;
      updatePlayer(ctx, dt);
      updateCamera(ctx);
    }

    updateHud(scene, game);
    render(scene.ctx, game);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
