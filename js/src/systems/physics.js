import { PHYSICS, WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants.js';
import { level } from '../config/level.js';
import { clamp, rectsOverlap, rangesOverlap, getPlayerRect } from '../core/math.js';
import { setOverlay } from '../dom/overlay.js';
import { triggerDeath } from './lifecycle.js';

export function updatePlayer(ctx, dt) {
  const { game, input, scene } = ctx;
  const player = game.player;
  const direction = Number(input.right) - Number(input.left);
  const targetVelocity = direction * PHYSICS.moveSpeed;
  const acceleration = player.onGround ? 2600 : 1700 * PHYSICS.airControl;

  if (direction !== 0) {
    player.facing = direction;
  }

  const deltaVelocity = targetVelocity - player.vx;
  const maxStep = acceleration * dt;
  player.vx += clamp(deltaVelocity, -maxStep, maxStep);

  if (direction === 0) {
    const drag = player.onGround ? 2400 : 900;
    const dragStep = drag * dt;
    if (Math.abs(player.vx) <= dragStep) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * dragStep;
    }
  }

  player.coyoteTimer = player.onGround ? 0.12 : Math.max(0, player.coyoteTimer - dt);
  player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);

  if (player.jumpBufferTimer === 0) {
    player.jumpBuffered = false;
  }

  if (player.jumpBuffered && player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = -PHYSICS.jumpVelocity;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBuffered = false;
    player.jumpBufferTimer = 0;
    game.message = 'Nice jump.';
  }

  const gravityScale = input.down && !player.onGround ? PHYSICS.fastFallGravityScale : 1;
  player.vy = Math.min(player.vy + PHYSICS.gravity * gravityScale * dt, PHYSICS.maxFallSpeed);

  movePlayerHorizontally(player, dt);
  movePlayerVertically(player, dt);

  if (player.onGround && Math.abs(player.vx) > 12) {
    player.walkPhase += Math.abs(player.vx) * dt * 0.028;
  } else {
    player.walkPhase = 0;
  }

  if (player.y > WORLD_HEIGHT + 140) {
    triggerDeath(ctx, 'You missed the platforms and fell into the abyss.');
    return;
  }

  const playerRect = getPlayerRect(player);
  for (const lava of level.lavaPools) {
    if (rectsOverlap(playerRect, lava)) {
      triggerDeath(ctx, 'The lava was a little too hot.');
      return;
    }
  }

  if (rectsOverlap(playerRect, level.goal)) {
    game.state = 'won';
    game.message = `You escaped the lava in ${game.timer.toFixed(1)}s with ${game.deaths} respawns.`;
    setOverlay(scene, game, 'You made it!', `${game.message} Press R to play again.`, true);
  }

  updateCheckpoints(game);
}

function updateCheckpoints(game) {
  const playerCenterX = game.player.x + game.player.width / 2;
  if (playerCenterX > 1180 && game.checkpointIndex < 1) {
    game.checkpointIndex = 1;
    game.message = 'Checkpoint reached: Midway.';
  }

  if (playerCenterX > 2090 && game.checkpointIndex < 2) {
    game.checkpointIndex = 2;
    game.message = 'Checkpoint reached: Final stretch.';
  }
}

function movePlayerHorizontally(player, dt) {
  const previousX = player.x;
  player.x += player.vx * dt;
  player.x = clamp(player.x, 0, WORLD_WIDTH - player.width);

  for (const platform of level.platforms) {
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    if (!rangesOverlap(playerTop, playerBottom, platform.y, platform.y + platform.height)) {
      continue;
    }

    const previousRight = previousX + player.width;
    const currentRight = player.x + player.width;
    const crossedIntoRightFace = player.vx > 0 && previousRight <= platform.x && currentRight >= platform.x;
    const crossedIntoLeftFace = player.vx < 0 && previousX >= platform.x + platform.width && player.x <= platform.x + platform.width;

    if (crossedIntoRightFace) {
      player.x = platform.x - player.width;
    } else if (crossedIntoLeftFace) {
      player.x = platform.x + platform.width;
    } else {
      continue;
    }

    player.vx = 0;
  }
}

function movePlayerVertically(player, dt) {
  const previousY = player.y;
  const previousBottom = previousY + player.height;
  const previousTop = previousY;
  let landed = false;

  player.y += player.vy * dt;

  for (const platform of level.platforms) {
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    if (!rangesOverlap(playerLeft, playerRight, platform.x, platform.x + platform.width)) {
      continue;
    }

    const currentBottom = player.y + player.height;
    const currentTop = player.y;
    const crossedTop = player.vy > 0 && previousBottom <= platform.y && currentBottom >= platform.y;
    const crossedBottom = player.vy < 0 && previousTop >= platform.y + platform.height && currentTop <= platform.y + platform.height;

    if (crossedTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      landed = true;
    } else if (crossedBottom) {
      player.y = platform.y + platform.height;
      player.vy = 0;
    }
  }

  player.onGround = landed;
}
