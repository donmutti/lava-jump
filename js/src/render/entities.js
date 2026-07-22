import { COLORS } from '../config/constants';
import { LEVELS } from '../config/level';

export function drawPlatforms(c, game) {
  const level = LEVELS[game.levelIndex];
  c.save();
  c.translate(-game.camera.x, -game.camera.y);

  for (const platform of level.platforms) {
    const topHeight = Math.min(12, platform.height);
    c.fillStyle = COLORS.platformFace;
    c.fillRect(platform.x, platform.y, platform.width, platform.height);
    c.fillStyle = COLORS.platformTop;
    c.fillRect(platform.x, platform.y, platform.width, topHeight);
    c.fillStyle = COLORS.platformEdge;
    c.fillRect(platform.x, platform.y + topHeight - 4, platform.width, 4);
  }

  c.restore();
}

export function drawPits(c, game) {
  const level = LEVELS[game.levelIndex];
  const fill = level.pit;
  c.save();
  c.translate(-game.camera.x, -game.camera.y);

  for (const pit of level.pits) {
    if (fill.style === 'chasm') {
      drawChasm(c, pit, fill);
    } else {
      drawLiquid(c, game, pit, fill);
    }
  }

  c.restore();
}

function drawChasm(c, pit, fill) {
  const gradient = c.createLinearGradient(0, pit.y, 0, pit.y + pit.height);
  gradient.addColorStop(0, fill.edge);
  gradient.addColorStop(1, fill.deep);
  c.fillStyle = gradient;
  c.fillRect(pit.x, pit.y, pit.width, pit.height);
}

function drawLiquid(c, game, pit, fill) {
  const intensity = fill.calm ? 0.5 : 1;
  const wave = Math.sin(game.lavaPhase * 4 + pit.x * 0.01) * 6 * intensity;
  const shimmer = Math.sin(game.lavaPhase * 6 + pit.width * 0.02) * 4 * intensity;

  c.shadowColor = fill.glow;
  c.shadowBlur = fill.calm ? 12 : 22;
  c.fillStyle = fill.deep;
  c.fillRect(pit.x, pit.y, pit.width, pit.height);

  const gradient = c.createLinearGradient(0, pit.y, 0, pit.y + pit.height);
  gradient.addColorStop(0, fill.hot);
  gradient.addColorStop(0.24, fill.surface);
  gradient.addColorStop(1, fill.deep);
  c.fillStyle = gradient;
  c.fillRect(pit.x, pit.y + 12, pit.width, pit.height - 12);

  c.shadowBlur = 0;
  c.fillStyle = fill.crest;
  c.beginPath();
  c.moveTo(pit.x, pit.y + 14 + wave);
  for (let x = 0; x <= pit.width; x += 20) {
    const crest = Math.sin(game.lavaPhase * 7 + x * 0.06 + pit.x * 0.02) * 6 * intensity;
    c.lineTo(pit.x + x, pit.y + 18 + crest);
  }
  c.lineTo(pit.x + pit.width, pit.y + pit.height);
  c.lineTo(pit.x, pit.y + pit.height);
  c.closePath();
  c.fill();

  for (let i = 0; i < pit.width; i += 40) {
    const bubbleX = pit.x + i + 12;
    const bubbleY = pit.y + 34 + ((game.lavaPhase * 40 + i * 0.5) % (pit.height - 46));
    c.fillStyle = fill.bubble;
    c.beginPath();
    c.arc(bubbleX, bubbleY - shimmer, 5 + ((i / 40) % 3), 0, Math.PI * 2);
    c.fill();
  }
}

export function drawGoal(c, game) {
  const level = LEVELS[game.levelIndex];
  c.save();
  c.translate(-game.camera.x, -game.camera.y);

  c.fillStyle = '#4d5a85';
  c.fillRect(level.goal.x + 26, level.goal.y + 18, 18, level.goal.height - 18);

  const pulse = 0.5 + Math.sin(game.timer * 3.5) * 0.18;
  c.shadowColor = COLORS.portal;
  c.shadowBlur = 26;
  c.fillStyle = `rgba(141, 244, 255, ${0.24 + pulse})`;
  c.beginPath();
  c.ellipse(level.goal.x + 35, level.goal.y + 36, 30 + pulse * 6, 40 + pulse * 6, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;

  c.strokeStyle = COLORS.portal;
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(level.goal.x + 35, level.goal.y + 36, 26, 38, 0, 0, Math.PI * 2);
  c.stroke();

  c.fillStyle = COLORS.portalCore;
  c.beginPath();
  c.arc(level.goal.x + 35, level.goal.y + 36, 10, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

export function drawPlayer(c, game) {
  const { player } = game;
  const x = player.x - game.camera.x;
  const y = player.y - game.camera.y;

  c.save();
  c.translate(x, y);
  c.fillStyle = COLORS.shadow;
  c.fillRect(4, player.height - 4, player.width - 8, 8);

  const swing = player.onGround ? Math.sin(player.walkPhase) : 0;
  const airborne = !player.onGround;

  c.fillStyle = COLORS.playerBody;

  if (airborne) {
    c.fillRect(2, 6, 6, 14);
    c.fillRect(30, 6, 6, 14);
  } else {
    c.fillRect(2, 12 - swing * 5, 6, 16);
    c.fillRect(30, 12 + swing * 5, 6, 16);
  }

  c.fillRect(6, 8, 26, 30);
  c.fillRect(10, 0, 18, 16);

  // Chicken comb — same red as the cutscene chicken's crest.
  c.fillStyle = '#e2483a';
  c.fillRect(14, -4, 10, 4);

  c.fillStyle = COLORS.playerAccent;
  c.fillRect(player.facing === 1 ? 23 : 9, 12, 6, 8);

  if (airborne) {
    c.fillRect(11, 40, 8, 12);
    c.fillRect(19, 40, 8, 12);
  } else {
    c.fillRect(8 + swing * 4, 38, 8, 14 - Math.abs(swing) * 3);
    c.fillRect(22 - swing * 4, 38, 8, 14 - Math.abs(swing) * 3);
  }

  c.fillStyle = '#1f2236';
  c.fillRect(14, 7, 3, 3);
  c.fillRect(21, 7, 3, 3);

  c.restore();
}
