import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants';
import { LEVELS } from '../config/level';
import { createPlayer } from '../entities/player';
import { clamp } from '../core/math';
import { setOverlay } from '../dom/overlay';

export function resetPlayer(ctx) {
  const { game, scene } = ctx;
  const level = LEVELS[game.levelIndex];
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = clamp(level.start.x - VIEWPORT_WIDTH * 0.35, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  game.camera.y = clamp(level.start.y - VIEWPORT_HEIGHT * 0.58, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);
  game.state = 'playing';
  game.message = `Restarted ${level.name}.`;
  setOverlay(scene, game, '', '', false);
  scene.canvas.focus();
}

export function advanceLevel(ctx) {
  const { game } = ctx;
  game.levelIndex += 1;
  const level = LEVELS[game.levelIndex];
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = clamp(level.start.x - VIEWPORT_WIDTH * 0.35, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  game.camera.y = clamp(level.start.y - VIEWPORT_HEIGHT * 0.58, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);
  showLevelIntro(ctx);
}

export function showLevelIntro(ctx) {
  const { game, scene } = ctx;
  const level = LEVELS[game.levelIndex];
  game.state = 'levelIntro';
  game.message = `Level ${game.levelIndex + 1}/${LEVELS.length}: ${level.name}.`;
  setOverlay(scene, game, `Level ${game.levelIndex + 1}/${LEVELS.length}: ${level.name}`, 'Press any movement key to begin.', true);
}

export function startPlaying(ctx) {
  const { game, scene } = ctx;
  game.state = 'playing';
  setOverlay(scene, game, '', '', false);
  scene.canvas.focus();
}

export function fullRestart(ctx) {
  const { game, scene } = ctx;
  const level = LEVELS[0];
  game.deaths = 0;
  game.timer = 0;
  game.levelIndex = 0;
  game.state = 'ready';
  game.message = 'Make it across the pits.';
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = 0;
  game.camera.y = 0;
  setOverlay(scene, game, 'Lava Jump', 'Press any movement key to begin. Reach the portal without falling into the pits.', true);
}

export function triggerDeath(ctx, message) {
  const { game, scene } = ctx;
  if (game.state !== 'playing') {
    return;
  }

  game.deaths += 1;
  game.state = 'respawning';
  game.message = message;
  setOverlay(scene, game, 'Ouch.', `${message} Press any movement key to restart the level.`, true);
}
