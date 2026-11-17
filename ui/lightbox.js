// ---------------------------------------------------------------------------
// lightbox.js — full-screen image viewer with wheel / pinch zoom, drag to pan,
// double-click to toggle zoom and +/− buttons. Used for degree and diploma
// scans, figures and anything with a gallery.
// ---------------------------------------------------------------------------
export function createLightbox({ root, stage, img, caption, btnIn, btnOut, btnReset, btnClose }) {
  let scale = 1, tx = 0, ty = 0;
  let open = false;
  const pointers = new Map();
  let pinchStart = null;

  const apply = () => { img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
  const clampPan = () => {
    if (scale <= 1) { tx = 0; ty = 0; return; }
    const r = img.getBoundingClientRect();
    const baseW = r.width / scale, baseH = r.height / scale;
    const maxX = Math.max(0, (baseW * scale - window.innerWidth) / 2 + 80);
    const maxY = Math.max(0, (baseH * scale - window.innerHeight) / 2 + 80);
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
  };
  const setScale = (s) => { scale = Math.max(1, Math.min(6, s)); clampPan(); apply(); };
  const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };

  function show(src, text) {
    img.src = src;
    img.alt = text || "";
    caption.textContent = text || "";
    reset();
    root.hidden = false;
    open = true;
    btnClose.focus({ preventScroll: true });
  }
  function hide() {
    if (!open) return;
    open = false;
    root.hidden = true;
    img.removeAttribute("src");
    pointers.clear();
  }

  btnIn.addEventListener("click", () => setScale(scale * 1.5));
  btnOut.addEventListener("click", () => setScale(scale / 1.5));
  btnReset.addEventListener("click", reset);
  btnClose.addEventListener("click", hide);
  root.addEventListener("click", (e) => { if (e.target === root || e.target === stage) hide(); });
  stage.addEventListener("wheel", (e) => { e.preventDefault(); setScale(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  img.addEventListener("dblclick", () => setScale(scale > 1 ? 1 : 2.5));

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), s: scale };
    }
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 2 && pinchStart) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      setScale(pinchStart.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.d));
    } else if (scale > 1) {
      tx += e.clientX - p.x; ty += e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      clampPan(); apply();
    }
  });
  const end = (e) => { pointers.delete(e.pointerId); pinchStart = null; if (!pointers.size) stage.classList.remove("dragging"); };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  return { show, hide, get isOpen() { return open; } };
}
