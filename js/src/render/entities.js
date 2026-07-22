import { VIEWPORT_HEIGHT, COLORS } from '../config/constants.js';
import { LEVELS } from '../config/level.js';

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

export function drawLava(c, game) {
  const level = LEVELS[game.levelIndex];
  c.save();
  c.translate(-game.camera.x, -game.camera.y);

  for (const lava of level.lavaPools) {
    const wave = Math.sin(game.lavaPhase * 4 + lava.x * 0.01) * 6;
    const shimmer = Math.sin(game.lavaPhase * 6 + lava.width * 0.02) * 4;
    c.shadowColor = COLORS.lava;
    c.shadowBlur = 22;
    c.fillStyle = COLORS.lavaDeep;
    c.fillRect(lava.x, lava.y, lava.width, lava.height);

    const lavaGradient = c.createLinearGradient(0, lava.y, 0, lava.y + lava.height);
    lavaGradient.addColorStop(0, COLORS.lavaHot);
    lavaGradient.addColorStop(0.24, COLORS.lava);
    lavaGradient.addColorStop(1, COLORS.lavaDeep);
    c.fillStyle = lavaGradient;
    c.fillRect(lava.x, lava.y + 12, lava.width, lava.height - 12);

    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255, 255, 255, 0.34)';
    c.beginPath();
    c.moveTo(lava.x, lava.y + 14 + wave);
    for (let x = 0; x <= lava.width; x += 20) {
      const crest = Math.sin(game.lavaPhase * 7 + x * 0.06 + lava.x * 0.02) * 6;
      c.lineTo(lava.x + x, lava.y + 18 + crest);
    }
    c.lineTo(lava.x + lava.width, lava.y + lava.height);
    c.lineTo(lava.x, lava.y + lava.height);
    c.closePath();
    c.fill();

    for (let i = 0; i < lava.width; i += 40) {
      const bubbleX = lava.x + i + 12;
      const bubbleY = lava.y + 34 + ((game.lavaPhase * 40 + i * 0.5) % (lava.height - 46));
      c.fillStyle = 'rgba(255, 209, 102, 0.45)';
      c.beginPath();
      c.arc(bubbleX, bubbleY - shimmer, 5 + ((i / 40) % 3), 0, Math.PI * 2);
      c.fill();
    }
  }

  c.restore();
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

export function drawForegroundHints(c) {
  c.save();
  c.fillStyle = 'rgba(255, 255, 255, 0.08)';
  c.font = '600 15px Inter, sans-serif';
  c.fillText('Tip: Hold S in the air for a fast fall.', 20, VIEWPORT_HEIGHT - 20);
  c.restore();
}
