import { createPlayer } from '../entities/player';
import { LEVELS } from '../config/level';

export function createInput() {
  return {
    left: false,
    right: false,
    up: false,
  };
}

export function createGame(now) {
  const level = LEVELS[0];
  return {
    state: 'ready',
    timer: 0,
    deaths: 0,
    levelIndex: 0,
    player: createPlayer(level.start.x, level.start.y),
    camera: { x: 0, y: 0 },
    lastFrame: now,
    message: 'Press A/D to move and W to jump.',
    overlayVisible: true,
    lavaPhase: 0,
    cutscene: null,
  };
}
