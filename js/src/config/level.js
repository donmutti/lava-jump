import rawLevels from './levels.json';
import { THEME, PIT } from './theme';

function toRect([x, y, width, height]) {
  return { x, y, width, height };
}

function toPoint([x, y]) {
  return { x, y };
}

export function expandLevel(raw) {
  return {
    name: raw.name,
    theme: THEME[raw.theme],
    pit: PIT[raw.pit],
    start: toPoint(raw.start),
    goal: toRect(raw.goal),
    platforms: raw.platforms.map(toRect),
    pits: raw.pits.map(toRect),
  };
}

export const LEVELS = rawLevels.map(expandLevel);
