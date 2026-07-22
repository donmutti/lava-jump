import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants.js';
import { clamp } from '../core/math.js';

export function updateCamera(ctx) {
  const { game } = ctx;
  const targetX = game.player.x + game.player.width / 2 - VIEWPORT_WIDTH * 0.35;
  const targetY = game.player.y + game.player.height / 2 - VIEWPORT_HEIGHT * 0.58;

  game.camera.x += (clamp(targetX, 0, WORLD_WIDTH - VIEWPORT_WIDTH) - game.camera.x) * 0.08;
  game.camera.y += (clamp(targetY, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT) - game.camera.y) * 0.08;
}
