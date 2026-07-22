# Lava Leap — Technical Specification

A small canvas-based browser platformer built with vanilla JavaScript. The player sprints and jumps across a molten obstacle course to reach a glowing portal, respawning at checkpoints on death.

> Note: the repository directory is `lava-jump`, but the product name is **Lava Leap** (see `package.json`, `index.html`, `README.md`).

---

## 1. Overview

| Field | Value |
| --- | --- |
| Genre | Side-scrolling 2D platformer |
| Platform | Modern desktop browsers (HTML5 Canvas 2D) |
| Stack | Vanilla JavaScript, HTML, CSS — no runtime framework |
| Build | Webpack 5 (dev server + production bundle) |
| Rendering | Single `<canvas>`, immediate-mode 2D drawing per frame |
| Entry point | `js/src/main.js` (bundled to `dist/js/app.js`) |

The game is split into ES modules under `js/src/` (config, core, dom, systems, render), composed at a single root (`context.js`) into a `ctx` object and driven by a `requestAnimationFrame` loop. See §16 for the module map.

---

## 2. Goals & non-goals

**Goals**
- Deliver a tight, responsive single-screen-scrolling platformer feel.
- Forgiving controls: coyote time and jump buffering.
- Checkpoint-based progression with death/respawn tracking.
- Self-contained, dependency-free runtime (no game engine).

**Non-goals**
- Multiplayer, persistence/save state, or a level editor.
- Mobile touch controls (pointer only starts the game; movement is keyboard).
- Audio.
- Multiple levels (one hardcoded level).

---

## 3. World & coordinate system

| Constant | Value | Meaning |
| --- | --- | --- |
| `VIEWPORT_WIDTH` | 960 | Canvas render width (px) |
| `VIEWPORT_HEIGHT` | 540 | Canvas render height (px) |
| `WORLD_WIDTH` | 2800 | Full level width (px) |
| `WORLD_HEIGHT` | 900 | Full level height (px) |

- Origin `(0,0)` is top-left; `+y` points down.
- The world is larger than the viewport; a camera scrolls to follow the player.
- The canvas is rendered at fixed 960×540 and scaled to fit its container via CSS (`width: 100%; height: auto`).

---

## 4. Physics

Defined in the `PHYSICS` constant:

| Property | Value | Description |
| --- | --- | --- |
| `gravity` | 2200 | Downward acceleration (px/s²) |
| `moveSpeed` | 340 | Target horizontal speed (px/s) |
| `jumpVelocity` | 840 | Upward launch velocity (px/s) |
| `maxFallSpeed` | 1200 | Terminal fall velocity (px/s) |
| `airControl` | 0.92 | Multiplier on airborne acceleration |
| `fastFallGravityScale` | 1.45 | Gravity multiplier while holding down midair |

**Movement model**
- Horizontal velocity approaches a target (`direction * moveSpeed`) using acceleration-limited steps: `2600` px/s² on ground, `1700 * airControl` airborne.
- When no directional input is held, drag decelerates the player: `2400` px/s² grounded, `900` airborne.
- Gravity integrates each frame, clamped to `maxFallSpeed`. Holding `S`/Down while airborne applies `fastFallGravityScale`.

**Jump forgiveness**
- **Coyote time** (`0.12s`): jump remains allowed briefly after leaving a ledge.
- **Jump buffer** (`0.15s`): a jump press is remembered briefly so it fires the moment the player lands.
- A jump fires only when a buffered press and coyote timer are both active.

---

## 5. Collision

Axis-separated, swept AABB resolution against platform rectangles (in `systems/physics.js`):

- `movePlayerHorizontally(player, dt)` advances `player.x`, then resolves against platform left/right faces (detecting the frame the player crossed a face), zeroing `vx` on contact. `player.x` is clamped to `[0, WORLD_WIDTH - width]`.
- `movePlayerVertically(player, dt)` advances `player.y`, then resolves top/bottom faces. Landing on a platform top sets `onGround = true` and zeroes `vy`; hitting a bottom face zeroes `vy`.
- Helpers `rectsOverlap`, `rangesOverlap`, `clamp`, `getPlayerRect` live in `core/math.js`.

**Death conditions** (checked each update):
- Falling below `WORLD_HEIGHT + 140` (the abyss).
- Overlapping any lava pool rectangle.

**Win condition**: player rectangle overlaps `level.goal`.

---

## 6. Level definition

A single hardcoded `level` object:

- `start`: `{ x: 80, y: 670 }` — initial spawn.
- `goal`: `{ x: 2620, y: 390, width: 70, height: 110 }` — the portal.
- `platforms`: 17 rectangles — 6 thick ground slabs (`height: 140`) plus 11 thin floating ledges (`height: 18`).
- `lavaPools`: 5 rectangles filling gaps between ground slabs (`height: 110`).

**Checkpoints** (on `game.checkpoints`, advanced by `updateCheckpoints`):

| Index | Label | Position | Trigger (player center x >) |
| --- | --- | --- | --- |
| 0 | Start | (80, 670) | — (initial) |
| 1 | Midway | (1090, 680) | 1180 |
| 2 | Final stretch | (2020, 370) | 2090 |

On death, the player respawns at the highest reached checkpoint.

---

## 7. Player

Created by `createPlayer(x, y)` (in `entities/player.js`):

- Size: `38 × 52` px.
- State: `x, y, vx, vy, onGround, facing` plus jump-forgiveness timers (`jumpBuffered`, `jumpBufferTimer`, `coyoteTimer`) and a walk-cycle clock (`walkPhase`).
- Rendered as a hand-drawn yellow figure (`playerBody` `#ffe082`) with an accent visor that flips with `facing`, plus a soft ground shadow.

**Walk animation**
- `walkPhase` accumulates each frame while the player is grounded and moving, advancing proportionally to horizontal speed so the stride cadence matches how fast the player runs. It resets when idle or airborne.
- Arms and legs swing in opposition using `sin(walkPhase)`: the leading arm moves forward while the trailing leg pushes back, and vice versa, producing a simple two-frame stride.
- The legs are drawn with a per-limb vertical/horizontal offset derived from the swing, so the body appears to stride rather than slide.
- When airborne, a static "jump" pose is used (legs tucked, arms raised); when idle, limbs return to a neutral standing pose.

---

## 8. Game state machine

`game.state` transitions:

| State | Meaning | Enter via | Exit to |
| --- | --- | --- | --- |
| `ready` | Title overlay shown, awaiting input | `fullRestart()` | `playing` on movement key |
| `playing` | Simulation running, timer accruing | `startPlayingIfNeeded()` / `resetPlayer()` | `respawning` / `won` |
| `respawning` | Death overlay, persists until dismissed | `triggerDeath()` | `playing` via `resetPlayer()` on any dismiss key |
| `won` | Victory overlay | goal overlap | `ready` via restart |

Tracked stats: `timer` (seconds), `deaths` (respawn count), `checkpointIndex`.

`triggerDeath()` increments deaths and shows the "Ouch." overlay. The death overlay **persists until the player presses a key** (it does not auto-dismiss on a timer), so the player has time to read it. Any movement/jump key resumes play by calling `resetPlayer()`, which respawns at the last checkpoint.

---

## 9. Input

Keyboard-driven, handled by `handleKeyChange`:

| Key(s) | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `W` / `↑` / `Space` | Jump (buffers a jump on press) |
| `S` / `↓` | Fast fall (airborne) |
| `R` | Full restart |
| `Enter` | Restart + start (when not playing) |

- Movement/jump keys call `preventDefault` to avoid page scroll.
- Any movement key while `ready` starts the game.
- Any movement/jump key while `respawning` dismisses the death overlay and respawns the player (the overlay otherwise waits indefinitely).
- `pointerdown` on the canvas starts the game and focuses it (no pointer-based movement).

---

## 10. Camera

`updateCamera` follows the player with eased (lerp factor `0.08`) tracking:

- Target places the player ~35% from the left and ~58% down the viewport.
- Camera position is clamped to keep the view inside world bounds.

---

## 11. Rendering

`render()` draws each frame in back-to-front order:

1. `drawBackground` — vertical sky gradient, moon with radial glow, two parallax mist bands, three parallax misty-mountain ridge layers, drifting star dots.
2. `drawPlatforms` — face + lit top edge + highlight strip (camera-translated).
3. `drawLava` — glowing deep base, vertical gradient, animated wave crest, and rising bubble particles driven by `game.lavaPhase`. Rendered in a hot red/orange palette.
4. `drawGoal` — pulsing portal (glow ellipse, ring, white core).
5. `drawPlayer` — the figure with facing-dependent accent.
6. `drawForegroundHints` — a faint on-canvas tip.

- Parallax layers translate by a fraction of `game.camera.x`; gameplay layers translate by the full camera offset.
- Palette centralized in the `COLORS` constant. Lava uses a hot red/orange palette (`#ff5a1f` surface, `#ffd166` crest highlight, `#7a1500` deep base).
- The background depicts layered misty mountain ridges receding into haze (three parallax `mountainFar/Mid/Near` layers), not a pine forest.

The DOM HUD (`updateHud`) is separate from canvas rendering and shows current checkpoint, respawn count, elapsed time, and a status message.

---

## 12. Game loop

`tick(now)`:

1. Compute `dt = min((now - lastFrame)/1000, 1/30)` — clamped to prevent large physics steps after tab stalls.
2. Advance `lavaPhase` (animation clock).
3. If `playing`: accrue timer, `updatePlayer(dt)`, `updateCamera()`.
4. Always: `updateHud()`, `render()`, schedule next frame.

Bootstrapped by `fullRestart()` then `requestAnimationFrame(tick)`.

---

## 13. DOM & page structure

- `index.html` provides the page shell (title, subtitle, instructions) and a `#game-root` mount point; `js/src/dom/scene.js` (`buildScene`) builds the game frame, HUD, canvas, and overlay imperatively and appends them.
- `css/style.css` — HTML5 Boilerplate base plus custom themed styles (dark dusk/mountain palette, glassmorphic panels, responsive layout, overlay card).
- A `<noscript>` fallback message displays if JavaScript is disabled.
- The canvas exposes `role="img"` and an `aria-label`; `#game-root` is `aria-live="polite"`.

---

## 14. Build & tooling

| Script | Command | Purpose |
| --- | --- | --- |
| `npm start` | `webpack serve --open --config webpack.config.dev.js` | Dev server with auto-open |
| `npm run build` | `webpack --config webpack.config.prod.js` | Production bundle → `dist/` |
| `npm test` | `npm run build` | Aliased to the build (no unit tests) |

- Webpack config split: `webpack.common.js` + dev/prod merges via `webpack-merge`.
- `html-webpack-plugin` and `copy-webpack-plugin` assemble static assets.
- Dev dependencies only — no runtime/production dependencies.

---

## 15. Known characteristics & constraints

- Single hardcoded level; no progression beyond the one goal.
- Keyboard-only gameplay; not playable on touch devices.
- No audio, no persistence, no scoring leaderboard.
- Fixed internal resolution (960×540) scaled by CSS; no DPR-aware rendering.
