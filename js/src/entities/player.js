export function createPlayer(x, y) {
  return {
    x,
    y,
    width: 38,
    height: 52,
    vx: 0,
    vy: 0,
    onGround: false,
    jumpBuffered: false,
    jumpBufferTimer: 0,
    coyoteTimer: 0,
    facing: 1,
    walkPhase: 0,
  };
}
