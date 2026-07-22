import { createContext } from './context.js';
import { fullRestart } from './systems/lifecycle.js';
import { startLoop } from './loop.js';

const ctx = createContext(document.getElementById('game-root'));
fullRestart(ctx);
startLoop(ctx);
