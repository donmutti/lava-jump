export function setOverlay(scene, game, title, body, message, visible, bare = false) {
  scene.overlayTitle.replaceChildren();
  title.split('\n').forEach((line) => {
    const span = document.createElement('span');
    span.className = 'overlay-title-line';
    span.textContent = line;
    scene.overlayTitle.append(span);
  });
  scene.overlayBody.textContent = body;
  scene.overlayBody.hidden = !body;
  scene.overlayMessage.textContent = message;
  scene.overlay.classList.toggle('overlay-bare', bare);
  scene.overlay.hidden = !visible;
  game.overlayVisible = visible;
}
