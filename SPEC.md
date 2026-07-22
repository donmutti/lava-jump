# Lava Jump — Technical Specification

A small canvas-based browser platformer built with vanilla JavaScript. The player sprints and jumps across a molten obstacle course to reach a glowing portal, restarting the current level from its start on death.

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
- Level-based progression with death/respawn tracking (respawn at the level start).
- Self-contained, dependency-free runtime (no game engine).

**Non-goals**
- Multiplayer, persistence/save state, or a level editor.
- Mobile touch controls (pointer only starts the game; movement is keyboard).
- Audio.

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

**Movement model**
- Horizontal velocity approaches a target (`direction * moveSpeed`) using acceleration-limited steps: `2600` px/s² on ground, `1700 * airControl` airborne.
- When no directional input is held, drag decelerates the player: `2400` px/s² grounded, `900` airborne.
- Gravity integrates each frame, clamped to `maxFallSpeed`. Holding `S`/Down while airborne applies `fastFallGravityScale`.

**Jump forgiveness**
- **Coyote time** (`0.12s`): jump remains allowed briefly after leaving a ledge.
- **Jump buffer** (`0.15s`): a jump press is remembered briefly so it fires the moment the player lands. Only a fresh key press arms the buffer; auto-repeat events from a held jump key are ignored, so holding jump does not re-jump on landing.
- A jump fires only when a buffered press and coyote timer are both active.

---

## 5. Collision

Axis-separated, swept AABB resolution against platform rectangles (in `systems/physics.js`):

- `movePlayerHorizontally(player, dt)` advances `player.x`, then resolves against platform left/right faces (detecting the frame the player crossed a face), zeroing `vx` on contact. `player.x` is clamped to `[0, WORLD_WIDTH - width]`.
- `movePlayerVertically(player, dt)` advances `player.y`, then resolves top/bottom faces. Landing on a platform top sets `onGround = true` and zeroes `vy`; hitting a bottom face zeroes `vy`.
- Helpers `rectsOverlap`, `rangesOverlap`, `clamp`, `getPlayerRect` live in `core/math.js`.

**Death conditions** (checked each update):
- Falling below `WORLD_HEIGHT + 140` (the abyss).
- Overlapping any pit rectangle (regardless of the pit's fill type — see §6.3).

**Win condition**: player rectangle overlaps `level.goal`.

---

## 6. Levels & progression

The game ships **5 hardcoded levels** of increasing difficulty, each with its own theme and pit fill (see §6.3). Levels are authored as data in `js/src/config/levels.json` and expanded at load into runtime `level` objects by `config/level.js` (see §6.1). The active level is `LEVELS[game.levelIndex]`; every consumer reads the current level rather than a static import.

The five levels: **Sunny Meadow** (field / water), **Poison Forest** (forest / poison), **Molten Cavern** (cave / lava), **Cliffs of Dawn** (mountain / abyss), **Xen Rift** (alien / plasma).

Each level object has this shape:

- `name`: display name, shown on the HUD and the level-intro screen (§8).
- `theme`: a `THEME` enum value selecting the background art and palette (§6.3).
- `pit`: a `PIT` enum value selecting the fill drawn in every pit rectangle and its palette (§6.3).
- `start`: `{ x, y }` — spawn point for the level.
- `goal`: `{ x, y, width, height }` — the portal that completes the level. The portal is drawn with a support leg whose foot sits at `(goal.x + 26 .. goal.x + 44, goal.y + goal.height)`; each level's `goal` is placed so that foot rests on a platform top (matching y, leg x-range within the platform span) rather than floating.
- `platforms`: array of `{ x, y, width, height }` rectangles — thick ground slabs plus thin floating ledges.
- `pits`: array of `{ x, y, width, height }` rectangles — deadly gaps (all share the level's `pit` fill).

### 6.1 Storage format

To stay human-readable yet compact, `levels.json` stores every rectangle/point as a **positional number tuple** rather than a keyed object; `name`, `theme`, and `pit` are plain string fields:

- Point → `[x, y]`
- Rect → `[x, y, width, height]`
- `theme` / `pit` → string keys matching the `THEME` / `PIT` enums (e.g. `"FIELD"`, `"WATER"`)

`config/level.js` exports `LEVELS` (the expanded array of level objects) and a helper `expandLevel(raw)` that maps the tuples back into the `{ x, y, width, height }` objects the rest of the code consumes, and resolves the `theme`/`pit` strings to their enum descriptors. Webpack imports the `.json` natively; no loader change.

### 6.3 Theming & pit fills

Two enums in `config/theme.js` drive per-level art:

- **`THEME`** selects the background: `FIELD`, `FOREST`, `CAVE`, `MOUNTAIN`, `ALIEN`. Each theme is a descriptor carrying a palette (sky gradient, ridge/mist colors, celestial body) plus a `silhouette` style (`'mountain'`, `'trees'`, `'cave'`, or `'asteroids'`) that `drawBackground` reads instead of the global `COLORS`. `'mountain'` draws jagged ridges (optionally snow-capped); `'trees'` draws a layered conifer treeline (FOREST); `'cave'` draws a rocky ceiling with hanging stalactites in place of the top layers (CAVE); `'asteroids'` draws a starfield with parallax drifting asteroids over empty space instead of ground ridges (ALIEN).
- **`PIT`** selects the fill drawn inside every pit rectangle: `WATER`, `POISON`, `LAVA`, `ABYSS`, `PLASMA`. Each is a descriptor carrying a palette and a draw style. `LAVA`/`WATER`/`POISON`/`PLASMA` render an animated liquid surface (varying palette and calmness); `ABYSS` renders a dark empty chasm with no liquid. All pit fills are equally fatal on overlap — the fill is purely visual plus flavor; it does not change collision or death rules.

`PIT` is deliberately scoped to *falling hazards that fill a rectangle*, not a general hazard concept — future moving threats (e.g. NPC birds) would be a separate model, not a `PIT` value.

### 6.2 Progression

- `game.levelIndex` tracks the current level (starts at 0).
- On reaching a level's goal: if a next level exists, advance (`levelIndex += 1`), spawn the player at the new level's `start`, and show its intro screen. If it was the **last** level, transition to `won`.
- `timer` and `deaths` **carry across levels** — they are whole-run totals, not per-level. `fullRestart()` resets `levelIndex` to 0 along with the run stats.
- The run is a **countdown against a fixed 5-minute (300s) budget** (`TIME_LIMIT`). `timer` accrues while `playing`; the HUD shows the remaining time (`TIME_LIMIT - timer`) as `MM:SS` (e.g. `04:59`). When `timer` reaches `TIME_LIMIT` mid-play, the run is lost immediately (`timeUp` game-over) — the Cow is not saved. The countdown pauses during level-intro overlays, death overlays, and cutscenes.
- On death, the player respawns at the current level's `start` — there are no mid-level checkpoints; each death costs the whole level.

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
| `intro` | Opening cutscene (letterboxed), backstory of the abduction | `fullRestart()` | `levelIntro` when the cutscene finishes or is skipped |
| `levelIntro` | Level-intro overlay (level number + name), awaiting input | intro cutscene finishing / `advanceLevel()` | `playing` on any movement/jump key |
| `playing` | Simulation running, timer accruing | dismissing the level-intro overlay / `resetPlayer()` | `respawning` / `levelIntro` / `ending` |
| `respawning` | Death overlay, persists until dismissed | `triggerDeath()` | `playing` via `resetPlayer()` on any dismiss key |
| `ending` | Closing cutscene (letterboxed), the happy return home | final-level goal overlap | `won` when the cutscene finishes or is skipped |
| `won` | Victory overlay (only after the ending cutscene) | ending cutscene finishing | `ready` via restart |
| `timeUp` | Time-out game-over overlay | `timer` reaching `TIME_LIMIT` while `playing` | `ready` via restart |

Tracked stats: `timer` (seconds elapsed, counts down from `TIME_LIMIT` for display), `deaths` (respawn count), `levelIndex`.

Each level begins with a **level-intro screen** (`levelIntro` state): an overlay showing the level position and name (e.g. "Level 1/5: Sunny Meadow"), which waits for a movement/jump keypress before entering `playing`. The world is rendered behind the overlay but the simulation and timer are paused until dismissed. This applies to the first level (reached when the intro cutscene finishes) and to every subsequent level reached via `advanceLevel()`.

Reaching a non-final level's goal does **not** enter `won`; it advances to the next level (see §6.2) and shows that level's intro screen (`levelIntro`). Only clearing the final level enters `won`.

`triggerDeath()` increments deaths and shows the "Ouch." overlay. The death overlay **persists until the player presses a key** (it does not auto-dismiss on a timer), so the player has time to read it. Any movement/jump key resumes play by calling `resetPlayer()`, which respawns at the current level's `start`.

Overlays have three text slots: a **title** and an in-card **body** (both inside the card), plus a bottom-centered **message** for the technical instruction. Story/flavor text (e.g. the death cause, the victory tally) goes in the card body next to the title; only the "Press … to …" instruction sits at the bottom. `setOverlay(scene, game, title, body, message, visible, bare)` populates them; an empty body is hidden so the card collapses to just the title.

### 8.1 Cutscenes

Two scripted, time-driven cutscenes bracket the game: an `intro` (played once at `fullRestart`, before the first level) and an `ending` (played after clearing the final level, before the `won` overlay). Both are letterboxed — black cinematic bars at the top and bottom of the canvas — and both advance on elapsed time (`dt`), not the simulation. `game.cutscene` holds `{ name, t }` where `name` is `'intro' | 'ending'` and `t` is seconds elapsed. When `t` reaches the cutscene's duration, or the player presses any key, the cutscene finishes and hands off to the next state (`intro` → `levelIntro` for level 1, `ending` → `won`). There is no separate title screen; the intro cutscene serves as the opening. The letterbox bars are drawn on the canvas by `render/cutscene.js`; the "Press any key to skip." hint is shown via the DOM overlay in "bare" mode (card hidden, only the bottom-centered message), so it shares styling and position with the level-intro "Press any movement key to begin." prompt.

The **intro** narrative (`render/intro.js`, dispatched by `render/cutscene.js` on `name === 'intro'`) plays out on Sunny Meadow — the same palette as level 1, so the opening reads as "home." The chicken lives in a little house on the grassy field beside his cow (drawn slightly larger than the chicken). Beats, keyed off `t` (seconds): a UFO descends from the top and hovers (~1.4–2.4s); a cyan telekinetic beam switches on (~2.6s); the cow floats up the beam into the saucer (~3.0–4.3s); the UFO flies back up and off with the cow (~4.4s onward), leaving the chicken alone by the house — the loss that motivates the rescue across the five levels. The **ending** narrative (the happy sunset homecoming) is still layered on later; that branch renders only the flat backdrop for now.

---

## 9. Input

Keyboard-driven, handled by `handleKeyChange`:

| Key(s) | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `W` / `↑` / `Space` | Jump (buffers a jump on press) |
| `R` | Full restart |
| `Enter` | Restart + start (when not playing) |

- Movement/jump keys call `preventDefault` to avoid page scroll.
- Any key while a cutscene is playing skips it.
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

1. `drawBackground` — theme-driven (§6.3): vertical sky gradient, a celestial body with radial glow, two parallax mist bands, three parallax silhouette layers, and drifting particles. Colors and silhouette style (mountains / treeline / cave with stalactites) come from the active level's `THEME` descriptor.
2. `drawPlatforms` — face + lit top edge + highlight strip (camera-translated).
3. `drawPits` — dispatches on the active level's `PIT` fill (§6.3): liquid fills (`WATER`/`POISON`/`LAVA`/`PLASMA`) draw a glowing base, vertical gradient, animated wave crest, and rising bubbles driven by `game.lavaPhase`, each in its own palette; `ABYSS` draws a dark empty chasm with no liquid.
4. `drawGoal` — pulsing portal (glow ellipse, ring, white core).
5. `drawPlayer` — the figure with facing-dependent accent.

- Parallax layers translate by a fraction of `game.camera.x`; gameplay layers translate by the full camera offset.
- The base palette lives in the `COLORS` constant; per-level background and pit-fill palettes live in the `THEME` / `PIT` descriptors in `config/theme.js`.
- `game.lavaPhase` is the shared animation clock for all pit liquids (name retained for continuity), advancing every frame regardless of state.

The DOM HUD (`updateHud`) is separate from canvas rendering and shows the current level position and name (`Level N/total: name`, left-aligned) and the remaining time (`MM:SS`, right-aligned).

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

- **Collectible items granting a super jump**: apples, cakes, and similar edibles scattered sparsely across the levels (2–3 per level). Collecting one grants a single super jump — a double-jump that lets the player jump again while already airborne (one extra jump per item collected).
- **Rename `package.json` `name` from `lava-leap` to `lava-jump`**: align the npm identifier with the rebranded product name and repo directory. Currently kept as `lava-leap` (see the note under §1's title); revisit whether the package id should follow the rename.
- **Remove `LICENSE.txt`**: drop the license file from the project.
- **Controls hint: arrows-only display**: keep accepting both `A`/`D` and `←`/`→` for movement (see §9), but show only the arrow keys in the on-screen controls hint (`.game-instructions` in `index.html`) rather than the `A`/`D` letters.
- **Ending cutscene narrative**: the happy sunset-Sunny-Meadow homecoming (chicken + rescued cow). Only the intro cutscene is built; `render/cutscene.js` renders a flat backdrop for `name === 'ending'` (see §8.1).
