import { LEVELS } from '../config/level';

export function updateHud(scene, game) {
  scene.levelStat.textContent = `Level ${game.levelIndex + 1}/${LEVELS.length}: ${LEVELS[game.levelIndex].name}`;
  scene.timeStat.textContent = `Time: ${game.timer.toFixed(1)}s`;
}
