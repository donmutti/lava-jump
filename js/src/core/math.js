export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

export function rangesOverlap(minA, maxA, minB, maxB) {
  return minA < maxB && maxA > minB;
}

export function getPlayerRect(player) {
  return {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };
}
