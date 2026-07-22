import { resetPlayer, fullRestart, showLevelIntro, startPlaying } from './lifecycle';

export function attachInput(ctx) {
  const { scene } = ctx;

  window.addEventListener('keydown', (event) => handleKeyChange(ctx, event, true));
  window.addEventListener('keyup', (event) => handleKeyChange(ctx, event, false));

  scene.canvas.addEventListener('pointerdown', () => {
    startPlayingIfNeeded(ctx);
    scene.canvas.focus();
  });
}

function startPlayingIfNeeded(ctx) {
  const { game } = ctx;
  if (game.state === 'ready') {
    showLevelIntro(ctx);
    ctx.scene.canvas.focus();
  } else if (game.state === 'levelIntro') {
    startPlaying(ctx);
  }
}

function queueJump(ctx) {
  ctx.game.player.jumpBuffered = true;
  ctx.game.player.jumpBufferTimer = 0.15;
}

function handleKeyChange(ctx, event, pressed) {
  const { game, input } = ctx;
  const key = event.key.toLowerCase();

  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }

  if (pressed && ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
    if (game.state === 'respawning') {
      resetPlayer(ctx);
    } else {
      startPlayingIfNeeded(ctx);
    }
  }

  if (key === 'a' || key === 'arrowleft') {
    input.left = pressed;
  }

  if (key === 'd' || key === 'arrowright') {
    input.right = pressed;
  }

  if (key === 's' || key === 'arrowdown') {
    input.down = pressed;
  }

  if (key === 'w' || key === 'arrowup' || key === ' ') {
    input.up = pressed;
    if (pressed && !event.repeat) {
      queueJump(ctx);
    }
  }

  if (pressed && key === 'r') {
    fullRestart(ctx);
  }

  if (pressed && key === 'enter' && game.state !== 'playing') {
    fullRestart(ctx);
    startPlayingIfNeeded(ctx);
  }
}
