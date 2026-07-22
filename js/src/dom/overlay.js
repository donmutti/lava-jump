export function setOverlay(scene, game, title, message, visible) {
  scene.overlayTitle.textContent = title;
  scene.overlayMessage.textContent = message;
  scene.overlay.hidden = !visible;
  game.overlayVisible = visible;
}
