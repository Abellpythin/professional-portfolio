// ---------------------------------------------------------------------------
// raycaster.js — hover + click detection for objects tagged
// `userData.interactive`.
//
// A "click" is a pointer press and release that stay within a few pixels of
// each other, so dragging to orbit the camera never triggers a click by
// accident (the first version fired on pointerdown, which it did).
//
// The nearest visible surface wins, so a chair in front of a frame blocks it,
// exactly as you would expect in a real room.
// ---------------------------------------------------------------------------
import * as THREE from "three";

export function setupRaycaster({ camera, scene, domElement, onHover, onMove, onClick, onMiss }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let down = null;
  let enabled = true;
  let pendingMove = null;
  let raf = 0;

  const ignored = (o) => {
    for (let p = o; p; p = p.parent) {
      if (p.visible === false) return true;
      if (p.userData && p.userData.ignoreRay) return true;
    }
    return false;
  };
  const interactiveOf = (o) => {
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.interactive) return p;
    return null;
  };

  function pick(clientX, clientY) {
    const r = domElement.getBoundingClientRect();
    pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const h of hits) {
      if (ignored(h.object)) continue;
      return interactiveOf(h.object); // nearest real surface decides (may be null)
    }
    return null;
  }

  function processMove() {
    raf = 0;
    if (!pendingMove || !enabled) return;
    const { x, y } = pendingMove;
    pendingMove = null;
    const target = pick(x, y);
    if (target !== hovered) {
      hovered = target;
      domElement.classList.toggle("hoverable", !!hovered);
      onHover && onHover(hovered);
    }
    onMove && onMove(hovered, x, y);
  }

  const onPointerMove = (e) => {
    if (e.pointerType === "touch" || !enabled) return;
    if (e.buttons) { // dragging the camera: drop hover state
      if (hovered) { hovered = null; domElement.classList.remove("hoverable"); onHover && onHover(null); onMove && onMove(null, e.clientX, e.clientY); }
      return;
    }
    pendingMove = { x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(processMove);
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  const onPointerUp = (e) => {
    if (!down || !enabled) { down = null; return; }
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const dt = performance.now() - down.t;
    down = null;
    if (moved > 7 || dt > 700) return;
    const target = pick(e.clientX, e.clientY);
    if (target) onClick && onClick(target);
    else onMiss && onMiss();
  };

  const onLeave = () => {
    if (hovered) { hovered = null; domElement.classList.remove("hoverable"); onHover && onHover(null); onMove && onMove(null, 0, 0); }
  };

  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointerleave", onLeave);

  return {
    pick,
    setEnabled(v) { enabled = v; if (!v) onLeave(); },
    clearHover: onLeave,
    dispose() {
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("pointerleave", onLeave);
    },
  };
}
