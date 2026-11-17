// ---------------------------------------------------------------------------
// main.js — application entry point.
//
//   content/portfolio.js  →  what is shown        (you edit this)
//   scene/*               →  the room and its objects
//   interactions/*        →  camera, picking, hover glow, day/night, bookshelf
//   ui/*                  →  panel, navigation, tour, image viewer
//
// This file only connects those pieces. You normally don't need to edit it.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { SITE, SECTIONS, ITEMS, TOUR, ROOMS } from "./content/portfolio.js";
import { tweens } from "./animations/flyTo.js";
import { buildRoom } from "./scene/room.js";
import { buildFurniture } from "./scene/furniture.js";
import { buildDecor, ZONE_VIEWS, pieceFromObject, WALLS, mount } from "./scene/decor.js";
import { buildDoor } from "./scene/door.js";
import { makeCanvas } from "./scene/art.js";
import { createBookshelf, pullOutBook } from "./interactions/bookshelf.js";
import { setupRaycaster } from "./interactions/raycaster.js";
import { setHover, setAccent, makeInteractive } from "./interactions/highlight.js";
import { createCameraRig, DEFAULT_VIEW, INTRO_VIEW } from "./interactions/cameraFocus.js";
import { createDayNight } from "./interactions/dayNight.js";
import { loadModels } from "./loaders/gltfLoader.js";
import { EXTRA_MODELS } from "./loaders/modelConfig.js";
import { createSoundManager } from "./audio/soundManager.js";
import { createPanel } from "./ui/panel.js";
import { createLightbox } from "./ui/lightbox.js";
import { createNav, createTooltip, createIntro } from "./ui/nav.js";
import { createTour } from "./ui/tour.js";

const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* ignore */ } },
};

// ---------------------------------------------------------------------------
// content lookups + page chrome
// ---------------------------------------------------------------------------
const itemsById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const secById = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
const roomOfSection = (id) => (secById[id] && secById[id].room) || "office";
const roomOfItem = (item) => roomOfSection(item.section);
const roomById = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
const otherRoom = (id) => (ROOMS.find((r) => r.id !== id) || ROOMS[0]).id;
const zoneViews = { ...ZONE_VIEWS };
const reduceMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let currentRoom = "office";
let roomsState = null;       // { office:{root,home,offset}, studio:{...} } (3D only)
let sunLight = null, cameraRef = null, pickApi = null, travelling = false, bootInstant = true;
const counts = {};
ITEMS.forEach((i) => (counts[i.section] = (counts[i.section] || 0) + 1));

document.title = `${SITE.name} — Portfolio`;
document.documentElement.style.setProperty("--accent", SITE.accent || "#7ee7d1");
setAccent(SITE.accent || "#7ee7d1");
$("brand-name").textContent = SITE.name;
$("brand-sub").textContent = SITE.headline;

const sound = createSoundManager();
const canvas = $("scene");
const progressBar = $("progress-bar");
const progressLabel = $("progress-label");
const tick = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
async function progress(f, label) {
  progressBar.style.width = `${Math.round(f * 100)}%`;
  progressLabel.textContent = label;
  await tick();
}

// ---------------------------------------------------------------------------
// shared UI state (panel, nav, tour, lightbox are created below)
// ---------------------------------------------------------------------------
let rig = null;               // camera rig (null in 2D fallback mode)
let pieces = new Map();       // item id → { center, normal, size, object }
let hintsOn = store.get("office-hints") !== "0";
let openBook = null;
let hintGroup = null;
let dayNight = null;
let tour = null;
let intro = null;
let controls = null;

const lightbox = createLightbox({
  root: $("lightbox"), stage: $("lb-stage"), img: $("lb-img"), caption: $("lb-caption"),
  btnIn: $("lb-in"), btnOut: $("lb-out"), btnReset: $("lb-reset"), btnClose: $("lb-close"),
});

const panel = createPanel({
  els: { root: $("panel"), scroll: $("panel-scroll"), close: $("panel-close"), crumbs: $("panel-crumbs") },
  site: SITE, sections: SECTIONS, items: ITEMS, rooms: ROOMS,
  cb: {
    goRoom: (id) => { stopTour(); goRoom(id, { walk: true }); },
    openItem: (id) => openItem(id),
    openSection: (id) => openSection(id),
    openIndex: () => openIndex(),
    close: () => closePanel(),
    lightbox: (src, caption) => lightbox.show(src, caption),
  },
});

const nav = createNav({
  navEl: $("nav"), sections: SECTIONS, counts, rooms: ROOMS,
  onSection: (id) => { stopTour(); openSection(id); },
  onRoom: (id) => { stopTour(); goRoom(id, { walk: true }); },
});
const tooltip = createTooltip($("tooltip"));

// ---------------------------------------------------------------------------
// navigation actions
// ---------------------------------------------------------------------------
function setHash(id) {
  try { history.replaceState(null, "", id ? `#${encodeURIComponent(id)}` : location.pathname + location.search); } catch (_) { /* file:// etc. */ }
}

function syncBook(id) {
  const item = itemsById[id];
  const book = item && item.section === "projects" ? pieces.get(id)?.object : null;
  if (openBook && openBook !== book) { pullOutBook(openBook, false); openBook = null; }
  if (book && openBook !== book) { pullOutBook(book, true); openBook = book; }
}

function refreshHints() {
  if (!hintGroup) return;
  hintGroup.visible = hintsOn && !panel.isOpen && !travelling && !(intro && intro.visible);
  hintGroup.children.forEach((sp) => { sp.visible = sp.userData.room === currentRoom; });
}

function stopTour(silent = true) { if (tour && tour.active) tour.stop(silent); }

function openItem(id, { fromTour = false } = {}) {
  const item = itemsById[id];
  if (!item) return;
  if (!fromTour) stopTour();
  if (roomOfItem(item) !== currentRoom) {
    if (!roomsState || bootInstant) setRoomInstant(roomOfItem(item));
    else { goRoom(roomOfItem(item), { walk: false }).then(() => openItem(id, { fromTour })); return; }
  }
  panel.showItem(id);
  nav.setActive(item.section);
  setHash(id);
  syncBook(id);
  const piece = pieces.get(id);
  if (rig && piece) rig.focus({ center: piece.center, normal: piece.normal, size: piece.focusSize }, { minDist: item.section === "projects" ? 1.2 : 0.9 });
  sound.click();
  refreshHints();
}

function openSection(id) {
  if (!secById[id]) return;
  if (roomOfSection(id) !== currentRoom) {
    if (!roomsState || bootInstant) setRoomInstant(roomOfSection(id));
    else { goRoom(roomOfSection(id), { walk: false }).then(() => openSection(id)); return; }
  }
  panel.showSection(id);
  nav.setActive(id);
  setHash(id);
  syncBook(null);
  if (rig && zoneViews[id]) rig.focus(zoneViews[id], { fill: 0.62, maxDist: 8.5 });
  sound.click();
  refreshHints();
}

function openIndex() {
  stopTour();
  panel.showIndex();
  nav.setActive(null);
  setHash("");
  syncBook(null);
  if (rig) rig.home();
  sound.click();
  refreshHints();
}

function closePanel() {
  if (!panel.isOpen) return;
  stopTour();
  panel.close();
  nav.setActive(null);
  setHash("");
  syncBook(null);
  if (rig) rig.home();
  sound.close();
  refreshHints();
}

function goHome() {
  stopTour();
  panel.close();
  nav.setActive(null);
  setHash("");
  syncBook(null);
  if (rig) rig.home();
  refreshHints();
}

function applyHash() {
  const id = decodeURIComponent((location.hash || "").slice(1));
  if (!id) return false;
  if (itemsById[id]) { openItem(id); return true; }
  if (secById[id]) { openSection(id); return true; }
  return false;
}

// ---------------------------------------------------------------------------
// rooms: the door, the fade, and switching what is visible
// ---------------------------------------------------------------------------
function setRoomInstant(id) {
  if (!roomsState || !roomsState[id]) return;
  currentRoom = id;
  Object.entries(roomsState).forEach(([key, r]) => { r.root.visible = key === id; });
  const off = roomsState[id].offset;
  if (sunLight) { sunLight.position.set(8 + off, 6, 4); sunLight.target.position.set(off, 0, -1); }
  nav.setRoom(id);
  nav.setActive(null);
  if (rig) rig.stop();
  const home = roomsState[id].home;
  cameraRef.position.copy(home.position);
  controls.target.copy(home.target);
  controls.update();
  if (pickApi) pickApi.clearHover();
  tooltip.hide();
  refreshHints();
}

async function goRoom(id, { walk = true } = {}) {
  if (travelling || !roomsState || !roomsState[id] || id === currentRoom) return;
  travelling = true;
  if (pickApi) pickApi.setEnabled(false);
  if (panel.isOpen) panel.close();
  nav.setActive(null);
  setHash("");
  syncBook(null);
  tooltip.hide();
  const quick = reduceMotion();
  try {
    if (walk && !quick && rig) {
      const door = pieces.get(currentRoom === "office" ? "door-studio" : "door-office");
      if (door) { rig.focus({ center: door.center, normal: door.normal, size: door.size }, { ms: 850, fill: 0.5, minDist: 2.6, maxDist: 5 }); await wait(900); }
    }
    const fade = $("roomfade");
    $("roomfade-label").textContent = (roomById[id] && roomById[id].label) || "";
    fade.classList.add("on");
    sound.whoosh && sound.whoosh();
    await wait(quick ? 30 : 460);
    setRoomInstant(id);
    await wait(quick ? 30 : 160);
    fade.classList.remove("on");
    await wait(quick ? 30 : 420);
  } finally {
    travelling = false;
    if (pickApi) pickApi.setEnabled(true);
  }
}

// ---------------------------------------------------------------------------
// guided tour
// ---------------------------------------------------------------------------
const isDoorStep = (id) => /^door-/.test(id);
const tourSteps = TOUR.filter((s) => itemsById[s.id] || secById[s.id] || isDoorStep(s.id));
tour = createTour({
  els: { bar: $("tourbar"), count: $("tour-count"), say: $("tour-say"), prev: $("tour-prev"), next: $("tour-next"), auto: $("tour-auto"), exit: $("tour-exit") },
  steps: tourSteps,
  go: (step) => {
    if (isDoorStep(step.id)) { goRoom(step.id === "door-studio" ? "studio" : "office", { walk: true }); return; }
    itemsById[step.id] ? openItem(step.id, { fromTour: true }) : openSection(step.id);
  },
  onEnd: () => closePanel(),
});

function startTour() {
  if (intro && intro.visible) intro.hide();
  if (!tourSteps.length) return;
  tour.start();
}

// ---------------------------------------------------------------------------
// HUD + keyboard
// ---------------------------------------------------------------------------
function toggleDayNight() {
  if (!dayNight) return;
  const night = dayNight.toggle();
  $("btn-daynight").textContent = night ? "☀️" : "🌙";
  store.set("office-night", night ? "1" : "0");
}
function toggleHints() {
  hintsOn = !hintsOn;
  store.set("office-hints", hintsOn ? "1" : "0");
  $("btn-hints").setAttribute("aria-pressed", String(hintsOn));
  refreshHints();
}
function toggleSound() {
  const muted = sound.toggleMute();
  $("btn-sound").textContent = muted ? "🔇" : "🔊";
}
function showHelp(show) { $("help").hidden = !show; if (show) $("help-close").focus({ preventScroll: true }); }

$("btn-tour").addEventListener("click", () => (tour.active ? tour.stop() : startTour()));
$("btn-index").addEventListener("click", openIndex);
$("btn-hints").addEventListener("click", toggleHints);
$("btn-daynight").addEventListener("click", toggleDayNight);
$("btn-sound").addEventListener("click", toggleSound);
$("btn-home").addEventListener("click", goHome);
$("brand").addEventListener("click", goHome);
$("btn-help").addEventListener("click", () => showHelp(true));
$("help-close").addEventListener("click", () => showHelp(false));
$("help").addEventListener("click", (e) => { if (e.target === $("help")) showHelp(false); });
$("btn-hints").setAttribute("aria-pressed", String(hintsOn));
$("btn-sound").textContent = sound.muted ? "🔇" : "🔊";

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target && e.target.tagName) || "";
  if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  const k = e.key;

  if (k === "Escape") {
    if (lightbox.isOpen) lightbox.hide();
    else if (!$("help").hidden) showHelp(false);
    else if (intro && intro.visible) intro.hide();
    else if (panel.isOpen) closePanel();
    else if (tour.active) tour.stop();
    else goHome();
    return;
  }
  if (travelling || lightbox.isOpen || !$("help").hidden || (intro && intro.visible)) return;

  if (k === "?") { showHelp(true); return; }
  const num = parseInt(k, 10);
  if (num >= 1 && num <= nav.visible.length) { stopTour(); openSection(nav.visible[num - 1].id); return; }
  switch (k.toLowerCase()) {
    case "t": tour.active ? tour.stop() : startTour(); break;
    case "c": openIndex(); break;
    case "n": toggleDayNight(); break;
    case "h": toggleHints(); break;
    case "m": toggleSound(); break;
    case "r": goHome(); break;
    case "d": if (roomsState) { stopTour(); goRoom(otherRoom(currentRoom), { walk: true }); } break;
    case "arrowright": case "arrowleft": {
      const dir = k === "ArrowRight" ? 1 : -1;
      if (tour.active) { dir > 0 ? tour.next() : tour.prev(); break; }
      if (panel.mode === "item") {
        const cur = itemsById[panel.currentId];
        const sib = ITEMS.filter((i) => i.section === cur.section);
        const next = sib[sib.findIndex((s) => s.id === cur.id) + dir];
        if (next) openItem(next.id);
      }
      break;
    }
    default: return;
  }
});

window.addEventListener("hashchange", () => { if (rig || panel) applyHash(); });

// ---------------------------------------------------------------------------
// no-WebGL fallback: the panel becomes a normal 2D page
// ---------------------------------------------------------------------------
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (_) { return false; }
}

function startFallback() {
  document.body.classList.add("no-webgl");
  document.body.classList.remove("is-loading");
  $("preloader").classList.add("done");
  $("fallback").hidden = false;
  $("btn-daynight").hidden = $("btn-hints").hidden = $("btn-home").hidden = $("btn-tour").hidden = true;
  panel.setStatic(true);
  if (!applyHash()) panel.showIndex();
}

// ---------------------------------------------------------------------------
// 3D scene
// ---------------------------------------------------------------------------
async function start3D() {
  await progress(0.04, "Creating renderer…");
  const isMobile = Math.min(window.innerWidth, window.innerHeight) < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd5e4f3);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 90);
  camera.position.copy(INTRO_VIEW.position);

  controls = new OrbitControls(camera, canvas);
  controls.target.copy(INTRO_VIEW.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.8;
  controls.maxDistance = 18;
  controls.maxPolarAngle = 1.52;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.8;
  controls.update();

  rig = createCameraRig({ camera, controls, getInsets: () => panel.insets(), getHome: () => (roomsState ? roomsState[currentRoom].home : DEFAULT_VIEW) });
  cameraRef = camera;

  await progress(0.12, "Lighting the room…");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  const hemi = new THREE.HemisphereLight(0xfff4de, 0x9a8670, 0.9);
  const sun = new THREE.DirectionalLight(0xfff0d6, 3.1);
  sun.position.set(8, 6, 4);
  sun.target.position.set(0, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(ambient, hemi, sun, sun.target);
  sunLight = sun;

  await progress(0.25, "Building the room…");
  const officeRoot = new THREE.Group();
  scene.add(officeRoot);
  const room = buildRoom({
    wall: 0xebe5d8, panel: "#2c5a44", pendant: 0x8a6a34, windowFrame: 0xf4f0e6, slab: 0x1c140e,
    floor: { h: 24, s: 32, l: 30 },
    rug: { base: "#1f5a43", border: "#e6c27a", dots: "#b3453a", a: "#7ee7d1", b: "#e6c27a" },
    rugPos: [0, 0.006, -0.7], rugSize: [4.4, 3.2],
    pendants: [[-1.9, -0.5], [1.9, -0.5]], window: { a: 3.0, y: 1.7, w: 1.0, h: 1.4 }, patch: [2.5, 0.013, 1.5],
  });
  officeRoot.add(room.group);

  await progress(0.38, "Furnishing the office…");
  const furniture = buildFurniture();
  officeRoot.add(furniture.group);

  await progress(0.52, "Hanging your work on the walls…");
  const decor = buildDecor(ITEMS, SECTIONS, SITE);
  officeRoot.add(decor.group);
  pieces = decor.pieces;

  await progress(0.66, "Stocking the bookshelf…");
  const projectItems = ITEMS.filter((i) => i.section === "projects");
  if (projectItems.length) {
    const shelf = createBookshelf(projectItems);
    shelf.group.position.set(-5 + 0.22, 0, 2.3);
    shelf.group.rotation.y = Math.PI / 2;
    officeRoot.add(shelf.group);
    shelf.group.updateMatrixWorld(true);
    const nrm = new THREE.Vector3(1, 0, 0);
    shelf.books.forEach((book, id) => {
      const center = book.getWorldPosition(new THREE.Vector3());
      pieces.set(id, pieceFromObject(itemsById[id], book, { normal: nrm, size: [0.7, 0.8], center }));
    });
  }

  // optional user-supplied .glb models
  const extras = EXTRA_MODELS.filter((m) => m.enabled);
  if (extras.length) {
    await progress(0.74, "Loading 3D models…");
    const models = await loadModels(extras, (f) => progress(0.74 + f * 0.1, `Loading 3D models… ${Math.round(f * 100)}%`));
    extras.forEach((cfg) => {
      const obj = models[cfg.id];
      if (!obj) return;
      obj.position.set(...cfg.position);
      obj.rotation.set(...cfg.rotation);
      obj.scale.setScalar(cfg.scale);
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      officeRoot.add(obj);
    });
  }

  await progress(0.86, "Adding the finishing touches…");
  // post-processing (bloom) – only used at night
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const composer = new EffectComposer(renderer);
  composer.renderTarget1.samples = 4;
  composer.renderTarget2.samples = 4;
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(size, 0.5, 0.65, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  dayNight = createDayNight({
    scene, renderer, lights: { ambient, hemi, sun }, room, lamp: furniture.lamp, extraLamps: furniture.extraLamps,
    bloomPass: bloom,
    initialNight: store.get("office-night") === "1",
  });
  dayNight.refreshMaterials();
  $("btn-daynight").textContent = dayNight.isNight ? "☀️" : "🌙";

  // hotspot dots
  hintGroup = new THREE.Group();
  hintGroup.userData.ignoreRay = true;
  const dot = makeCanvas(128, 128);
  {
    const g = dot.getContext("2d");
    const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.28, "rgba(126,231,209,0.95)"); rg.addColorStop(0.5, "rgba(126,231,209,0.25)"); rg.addColorStop(1, "rgba(126,231,209,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 26, 0, Math.PI * 2); g.stroke();
  }
  const dotTex = new THREE.CanvasTexture(dot);
  dotTex.colorSpace = THREE.SRGBColorSpace;
  let n = 0;
  pieces.forEach((p) => {
    const mat = new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, toneMapped: false });
    const s = new THREE.Sprite(mat);
    s.position.copy(p.center).addScaledVector(p.normal, 0.16);
    s.userData = { ignoreRay: true, room: p.room || roomOfSection(p.section), phase: n++ * 0.9, base: p.section === "projects" ? 0.11 : p.section === "profiles" ? 0.11 : 0.15 };
    s.raycast = () => {};
    hintGroup.add(s);
  });
  scene.add(hintGroup);

  // picking
  let hovered = null;
  const raycaster = setupRaycaster({
    camera, scene, domElement: canvas,
    onHover: (t) => {
      if (hovered && hovered !== t) setHover(hovered, false);
      hovered = t;
      if (t) { setHover(t, true); sound.hover(); }
    },
    onMove: (t, x, y) => {
      if (!t) return tooltip.hide();
      const ud = t.userData;
      const sec = secById[ud.section] || secById[ud.id];
      const sub = ud.type === "door" ? "Click to walk through" : ud.type === "section" ? "Open this section" : `${sec ? sec.label + " · " : ""}${ud.type === "book" ? "pull it off the shelf" : "click to open"}`;
      tooltip.show(ud.label, sub, x, y);
    },
    onClick: (t) => { tooltip.hide(); if (t.userData.type === "door") { stopTour(); goRoom(t.userData.to, { walk: true }); return; } t.userData.type === "section" ? (stopTour(), openSection(t.userData.id)) : openItem(t.userData.id); },
    onMiss: () => { if (panel.isOpen && !tour.active) closePanel(); },
  });

  pickApi = raycaster;

  // resize
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  // render loop (with a simple adaptive resolution guard for slow GPUs)
  let frames = 0, lastT = performance.now(), slow = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    tweens.update(now);
    furniture.monitor.update(now);
    if (furniture.fan) furniture.fan.userData.rotor.rotation.y = now * 0.0006;
    if (hintGroup.visible) {
      hintGroup.children.forEach((s) => {
        const k = 1 + 0.28 * Math.sin(now * 0.003 + s.userData.phase);
        s.scale.setScalar(s.userData.base * k);
        s.material.opacity = 0.62 + 0.3 * Math.sin(now * 0.003 + s.userData.phase);
      });
    }
    controls.update();
    if (camera.position.y < 0.3) camera.position.y = 0.3;

    if (dayNight.bloomActive) composer.render(); else renderer.render(scene, camera);

    frames++;
    if (now - lastT > 2000) {
      const fps = (frames * 1000) / (now - lastT);
      frames = 0; lastT = now;
      if (fps < 24 && pixelRatio > 1) { slow++; if (slow >= 2) { pixelRatio = 1; renderer.setPixelRatio(1); composer.setPixelRatio(1); onResize(); } } else slow = 0;
    }
  }
  requestAnimationFrame(frame);

  // ----- reveal -----
  await progress(1, "Ready");
  const hasHash = !!decodeURIComponent((location.hash || "").slice(1));
  const seen = store.sget("office-intro-seen") === "1";
  const showIntro = !hasHash && !seen;

  intro = createIntro({
    root: $("intro"), site: SITE, enterBtn: $("intro-enter"), tourBtn: $("intro-tour"),
    onEnter: () => { controls.autoRotate = false; store.sset("office-intro-seen", "1"); rig.home(1800); refreshHints(); },
    onTour: () => { controls.autoRotate = false; store.sset("office-intro-seen", "1"); startTour(); },
  });

  $("preloader").classList.add("done");
  document.body.classList.remove("is-loading");

  if (showIntro) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    intro.show();
  } else {
    camera.position.copy(DEFAULT_VIEW.position);
    controls.target.copy(DEFAULT_VIEW.target);
    controls.update();
    if (hasHash) applyHash();
  }
  bootInstant = false;
  refreshHints();

  // handy for debugging in the console: window.__office.openItem("research-1")
  window.__office = { goRoom, setRoomInstant, get currentRoom() { return currentRoom; }, openItem, openSection, openIndex, startTour, camera, controls, scene, pieces, panel, dayNight, renderer, toggleDayNight };
}

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------
(async function boot() {
  if (!webglAvailable()) { startFallback(); return; }
  try {
    await start3D();
  } catch (err) {
    console.error(err);
    if (window.__loadFail) window.__loadFail("Error: " + (err && err.message ? err.message : err));
    // offer the 2D version so visitors are never left with nothing
    setTimeout(startFallback, 1800);
  }
})();
