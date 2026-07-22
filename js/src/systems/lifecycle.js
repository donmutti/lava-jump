import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants';
import { LEVELS } from '../config/level';
import { createPlayer } from '../entities/player';
import { clamp } from '../core/math';
import { setOverlay } from '../dom/overlay';

export const CUTSCENE_DURATION = {
  intro: 6,
  ending: 6,
};

export function startCutscene(ctx, name) {
  const { game, scene } = ctx;
  game.state = name;
  game.cutscene = { name, t: 0 };
  setOverlay(scene, game, '', '', false);
}

export function advanceCutscene(ctx, dt) {
  const { game } = ctx;
  if (!game.cutscene) {
    return;
  }
  game.cutscene.t += dt;
  if (game.cutscene.t >= CUTSCENE_DURATION[game.cutscene.name]) {
    finishCutscene(ctx);
  }
}

export function finishCutscene(ctx) {
  const { game, scene } = ctx;
  const name = game.cutscene ? game.cutscene.name : null;
  game.cutscene = null;

  if (name === 'ending') {
    game.state = 'won';
    game.message = `You cleared all ${LEVELS.length} levels in ${game.timer.toFixed(1)}s with ${game.deaths} respawns.`;
    setOverlay(scene, game, 'You made it!', `${game.message} Press R to play again.`, true);
  } else {
    showLevelIntro(ctx);
  }
  scene.canvas.focus();
}

export function resetPlayer(ctx) {
  const { game, scene } = ctx;
  const level = LEVELS[game.levelIndex];
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = clamp(level.start.x - VIEWPORT_WIDTH * 0.35, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  game.camera.y = clamp(level.start.y - VIEWPORT_HEIGHT * 0.58, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);
  game.state = 'playing';
  game.message = `Restarted ${level.name}.`;
  setOverlay(scene, game, '', '', false);
  driveInHud(scene);
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
  driveInHud(scene);
  scene.canvas.focus();
}

function driveInHud(scene) {
  scene.hud.classList.remove('hud-enter');
  // force reflow so the animation restarts from its off-screen position
  void scene.hud.offsetWidth;
  scene.hud.classList.add('hud-enter');
}

export function fullRestart(ctx) {
  const { game } = ctx;
  const level = LEVELS[0];
  game.deaths = 0;
  game.timer = 0;
  game.levelIndex = 0;
  game.player = createPlayer(level.start.x, level.start.y);
  game.camera.x = 0;
  game.camera.y = 0;
  startCutscene(ctx, 'intro');
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
