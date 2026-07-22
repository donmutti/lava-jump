import { buildScene } from './dom/scene.js';
import { createInput, createGame } from './core/state.js';
import { attachInput } from './systems/input.js';

export function createContext(root) {
  const scene = buildScene(root);
  const input = createInput();
  const game = createGame(performance.now());

  const ctx = { scene, input, game };
  attachInput(ctx);

  return ctx;
}
