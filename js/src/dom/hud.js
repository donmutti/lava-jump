import { LEVELS } from '../config/level';
import { TIME_LIMIT } from '../config/constants';

export function updateHud(scene, game) {
  scene.levelStat.textContent = `Level ${game.levelIndex + 1}/${LEVELS.length}: ${LEVELS[game.levelIndex].name}`;
  scene.timeStat.textContent = formatTimeLeft(TIME_LIMIT - game.timer);
}

function formatTimeLeft(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
