import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants.js';
import { level } from '../config/level.js';
import { createPlayer } from '../entities/player.js';
import { clamp } from '../core/math.js';
import { setOverlay } from '../dom/overlay.js';

export function resetPlayer(ctx) {
  const { game, scene } = ctx;
  const checkpoint = game.checkpoints[game.checkpointIndex];
  game.player = createPlayer(checkpoint.x, checkpoint.y);
  game.camera.x = clamp(checkpoint.x - VIEWPORT_WIDTH * 0.35, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  game.camera.y = clamp(checkpoint.y - VIEWPORT_HEIGHT * 0.58, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);
  game.state = 'playing';
  game.message = `Respawned at ${checkpoint.label}.`;
  setOverlay(scene, game, '', '', false);
  scene.canvas.focus();
}

export function fullRestart(ctx) {
  const { game, scene } = ctx;
  game.deaths = 0;
  game.timer = 0;
  game.checkpointIndex = 0;
  game.state = 'ready';
  game.message = 'Make it across the lava fields.';
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = 0;
  game.camera.y = 0;
  setOverlay(scene, game, 'Lava Leap', 'Press any movement key to begin. Reach the portal without falling into lava.', true);
}

export function triggerDeath(ctx, message) {
  const { game, scene } = ctx;
  if (game.state !== 'playing') {
    return;
  }

  game.deaths += 1;
  game.state = 'respawning';
  game.message = message;
  setOverlay(scene, game, 'Ouch.', `${message} Press any movement key to respawn at your last checkpoint.`, true);
}
