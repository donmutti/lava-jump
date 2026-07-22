import { buildScene } from './dom/scene';
import { createInput, createGame } from './core/state';
import { attachInput } from './systems/input';

export function createContext(root) {
  const scene = buildScene(root);
  const input = createInput();
  const game = createGame(performance.now());

  const ctx = { scene, input, game };
  attachInput(ctx);

  return ctx;
}
