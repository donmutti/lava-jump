# Lava Jump — Technical Specification

A small canvas-based browser platformer built with vanilla JavaScript. The player sprints and jumps across a molten obstacle course to reach a glowing portal, respawning at checkpoints on death.

> Note: the product name is **Lava Jump**, matching the repository directory `lava-jump`. The `package.json` `name` field remains the npm identifier `lava-leap` (a package id, not user-facing branding).

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
- The canvas is rendered in a fixed 960×540 logical coordinate space and scaled to fit its container via CSS (`width: 100%; height: auto`). All game logic, physics, camera, and drawing work in these logical units.
- **DPR-aware rendering**: the canvas backing store is sized to `960 × devicePixelRatio` by `540 × devicePixelRatio`, and the 2D context is scaled by `devicePixelRatio` once at construction (in `buildScene`) so every draw call still uses logical 960×540 coordinates. This keeps rendering crisp on HiDPI/Retina displays. DPR is read once on load; a mid-session DPR change (e.g. dragging the window between monitors of differing density) is not re-detected.

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

## 6. Levels & progression

The game ships **5 hardcoded levels** of increasing difficulty (level 1 is the original layout). Levels are authored as data in `js/src/config/levels.json` and expanded at load into runtime `level` objects by `config/level.js` (see §6.1). The active level is `LEVELS[game.levelIndex]`; every consumer reads the current level rather than a static import.

Each level object has the same shape as before:

- `start`: `{ x, y }` — spawn point for the level.
- `goal`: `{ x, y, width, height }` — the portal that completes the level.
- `platforms`: array of `{ x, y, width, height }` rectangles — thick ground slabs plus thin floating ledges.
- `lavaPools`: array of `{ x, y, width, height }` rectangles — deadly gaps.
- `checkpoints`: array of `{ x, y, label, triggerX }` — respawn points, advanced when the player's center x passes `triggerX`. Index 0 is the level `start` (no `triggerX`).

### 6.1 Storage format

To stay human-readable yet compact, `levels.json` stores every rectangle/point as a **positional number tuple** rather than a keyed object:

- Point → `[x, y]`
- Rect → `[x, y, width, height]`
- Checkpoint → `[x, y, label, triggerX]` (index 0 omits `triggerX`)

`config/level.js` exports `LEVELS` (the expanded array of level objects) and a helper `expandLevel(raw)` that maps the tuples back into the `{ x, y, width, height }` / `{ x, y, label, triggerX }` objects the rest of the code consumes — so physics, render, and state logic are unchanged apart from reading `LEVELS[game.levelIndex]`. Webpack imports the `.json` natively; no loader change.

### 6.2 Progression

- `game.levelIndex` tracks the current level (starts at 0).
- On reaching a level's goal: if a next level exists, advance (`levelIndex += 1`), respawn the player at the new level's `start`, reset checkpoints to that level, and continue playing. If it was the **last** level, transition to `won`.
- `timer` and `deaths` **carry across levels** — they are whole-run totals, not per-level. `fullRestart()` resets `levelIndex` to 0 along with the run stats.
- On death, the player respawns at the highest reached checkpoint **within the current level**.

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
| `won` | Victory overlay (only after the final level) | last-level goal overlap | `ready` via restart |

Tracked stats: `timer` (seconds), `deaths` (respawn count), `levelIndex`, `checkpointIndex`.

Reaching a non-final level's goal does **not** enter `won`; it advances to the next level (see §6.2) while staying in `playing`. Only clearing the final level enters `won`.

`triggerDeath()` increments deaths and shows the "Ouch." overlay. The death overlay **persists until the player presses a key** (it does not auto-dismiss on a timer), so the player has time to read it. Any movement/jump key resumes play by calling `resetPlayer()`, which respawns at the last checkpoint in the current level.

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
- Because `#game-root` is empty until `buildScene` runs, `css/style.css` reserves the full frame footprint on `.game-root:empty` via two pseudo-elements: a font-relative HUD strip (`calc(0.95rem * 1.4 + 16px)` — one pill row: line-height plus padding and border) and a 16:9 canvas box (`aspect-ratio`, sized from the root's own width and painted with the canvas background), separated by the 12px frame gap. No hardcoded pixel heights, so the reservation holds at any viewport, font size, or zoom and the page does not reflow — the title never flashes through on load.

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

- 5 hardcoded levels; no level editor or procedural generation.
- Keyboard-only gameplay; not playable on touch devices.
- No audio, no persistence, no scoring leaderboard.
- Fixed logical resolution (960×540) scaled by CSS; DPR-aware backing store is applied once on load, so a mid-session device-pixel-ratio change is not re-detected.

---

## 16. Parking Lot

Ideas captured for later; not yet specified or scheduled.

- **Checkpoint semaphore with finger signs** (à la the DOS game "Prehistoric"): each checkpoint shows a semaphore with two finger-sign hands. Before the checkpoint is reached, the left hand points left and the right hand points down at the ground. Once reached, the left hand points down at the ground and the right hand points right (toward the way forward).
- **Collectible items granting a super jump**: apples, cakes, and similar edibles scattered sparsely across the levels (2–3 per level). Collecting one grants a single super jump — a double-jump that lets the player jump again while already airborne (one extra jump per item collected).
- **Per-level theming (background + hazard)**: each level gets its own distinct art style, with the pit hazard varying per theme (lava is not universal). Proposed progression: (1) a merry field in daylight/dusk with a sun, where pits hold **water** instead of lava; (2) late evening after dusk in a dark forest, with pits of **poisonous swampy water**; (3) a **cave** with **lava** pits; (4) mountain pinnacles at **dawn** with drifting clouds and **empty pits** (no water or lava — just a fatal fall); (5) an **alien world** à la Half-Life's Xen. Requires generalizing the hazard model beyond "lavaPools" (e.g. typed hazards) and per-level background/palette selection.
