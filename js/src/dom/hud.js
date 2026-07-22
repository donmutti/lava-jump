export function updateHud(scene, game) {
  scene.checkpointStat.textContent = `Checkpoint: ${game.checkpoints[game.checkpointIndex].label}`;
  scene.deathStat.textContent = `Respawns: ${game.deaths}`;
  scene.timeStat.textContent = `Time: ${game.timer.toFixed(1)}s`;
  scene.statusLabel.textContent = game.message;
}
