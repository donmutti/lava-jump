import { LEVELS } from '../config/level';
import { TIME_LIMIT } from '../config/constants';

export function updateHud(scene, game) {
  const index = document.createElement('span');
  index.className = 'hud-level-index';
  index.textContent = `${game.levelIndex + 1}/${LEVELS.length}`;
  scene.levelStat.replaceChildren(index, ` ${LEVELS[game.levelIndex].name}`);
  scene.timeStat.textContent = formatTimeLeft(TIME_LIMIT - game.timer);
}

function formatTimeLeft(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
