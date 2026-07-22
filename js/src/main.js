import { createContext } from './context';
import { fullRestart } from './systems/lifecycle';
import { startLoop } from './loop';

const ctx = createContext(document.getElementById('game-root'));
window.__ctx = ctx;
fullRestart(ctx);
startLoop(ctx);
