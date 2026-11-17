// ---------------------------------------------------------------------------
// room.js — floor, three walls (the fourth is open like a dollhouse so the
// camera can see in), ceiling, window, pendant lamps and baseboards.
//
// Coordinates: the room spans x ∈ [-5, 5], z ∈ [-4.5, 4.5], height 3.2.
// The north wall (z = -4.5) is the "main" wall behind the desk.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { woodFloorCanvas, rugCanvas, windowCanvas, toTexture, makeCanvas } from "./art.js";

export const ROOM = { w: 10, d: 8, h: 3.0 };
const ZC = -4.5 + ROOM.d / 2; // room centre on z (north wall stays at z = -4.5)
export const WINDOW = { a: 3.5, y: 1.78, w: 1.5, h: 1.7 }; // on the east wall
const WINDOW_DEFAULT = { ...WINDOW, wall: "east" };

const std = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

function panelCanvas(color = "#26365a") {
  const W = 256, H = 256;
  const c = makeCanvas(W, H);
  const x = c.getContext("2d");
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(255,255,255,0.05)"); g.addColorStop(1, "rgba(0,0,0,0.12)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(0,0,0,0.35)"; x.lineWidth = 4; x.strokeRect(22, 30, W - 44, H - 60);
  x.strokeStyle = "rgba(255,255,255,0.16)"; x.lineWidth = 2; x.strokeRect(26, 34, W - 52, H - 68);
  x.fillStyle = "rgba(0,0,0,0.35)"; x.fillRect(0, 0, 3, H); x.fillRect(W - 3, 0, 3, H);
  return c;
}

function sunPatchCanvas() {
  const c = makeCanvas(256, 256);
  const x = c.getContext("2d");
  const pane = (px, py) => {
    const g = x.createLinearGradient(px, py, px + 100, py + 100);
    g.addColorStop(0, "rgba(255,240,200,0.95)"); g.addColorStop(1, "rgba(255,225,160,0.7)");
    x.fillStyle = g; x.fillRect(px, py, 104, 104);
  };
  pane(18, 18); pane(134, 18); pane(18, 134); pane(134, 134);
  return c;
}

export function buildRoom(opts = {}) {
  const o = {
    wall: 0xebe5d8, panel: "#26365a", floor: undefined, rug: undefined, rugPos: [0, 0.006, -0.95], rugSize: [4.6, 3.45],
    pendant: 0x23304f, pendants: [[-1.9, -0.5], [1.9, -0.5]], slab: 0x1b2030, patch: [2.5, 0.013, 2.15],
    trim: 0xf4f0e6, rail: 0xf1ece0, cap: 0xd9d2c2, window: {}, windowFrame: 0xf4f0e6, windowStyle: "city", ceiling: 0xf6f4ee, ...opts,
  };
  const group = new THREE.Group();
  const result = { group, pendants: [], windowTextures: {}, windowMat: null, sunPatchMat: null };

  // ----- floor + slab -----
  const floorTex = toTexture(woodFloorCanvas(o.floor));
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(ROOM.w / 2.6, ROOM.d / 2.6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.02 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = ZC;
  floor.receiveShadow = true;
  group.add(floor);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w + 0.4, 0.3, ROOM.d + 0.4), std(o.slab, 0.9));
  slab.position.set(0, -0.153, ZC);
  slab.receiveShadow = true;
  group.add(slab);

  // ----- rug -----
  const rugTex = toTexture(o.rugCanvas || rugCanvas(o.rug));
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(o.rugSize[0], o.rugSize[1]), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(...o.rugPos);
  rug.receiveShadow = true;
  group.add(rug);

  // ----- walls (single sided, facing inward) -----
  const wallMat = std(o.wall, 0.96);
  const panelTex = toTexture(panelCanvas(o.panel));
  panelTex.wrapS = THREE.RepeatWrapping;
  const railMat = std(o.rail, 0.6);
  const trimMat = std(o.trim, 0.55);

  const makeWall = (len, x, z, rotY) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, ROOM.h), wallMat);
    wall.position.set(0, ROOM.h / 2, 0);
    wall.receiveShadow = true;
    g.add(wall);
    const pt = panelTex.clone();
    pt.needsUpdate = true;
    pt.repeat.set(len / 1.0, 1);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.95), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.7 }));
    panel.position.set(0, 0.475, 0.004);
    panel.receiveShadow = true;
    g.add(panel);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.045, 0.04), railMat);
    rail.position.set(0, 0.96, 0.02);
    g.add(rail);
    const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.11, 0.025), trimMat);
    base.position.set(0, 0.055, 0.0125);
    g.add(base);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.06), trimMat);
    crown.position.set(0, ROOM.h - 0.04, 0.03);
    g.add(crown);
    // wall "thickness" cap, visible from the dollhouse side
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len + 0.2, 0.06, 0.24), std(o.cap, 0.9));
    cap.position.set(0, ROOM.h + 0.03, -0.1);
    g.add(cap);
    group.add(g);
    return g;
  };
  makeWall(ROOM.w, 0, -4.5, 0);                 // north, faces +z
  makeWall(ROOM.d, -ROOM.w / 2, ZC, Math.PI / 2);       // west,  faces +x
  makeWall(ROOM.d, ROOM.w / 2, ZC, -Math.PI / 2);       // east,  faces -x

  // ----- ceiling -----
  const ceilingMat = new THREE.MeshStandardMaterial({ color: o.ceiling, roughness: 1, emissive: 0x4a463c, emissiveIntensity: 1 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), ceilingMat);
  result.ceilingMat = ceilingMat;
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.h, ZC);
  group.add(ceiling);

  // ----- window (east wall by default; the bedroom puts it on the north wall) -----
  const WINDOW = { ...WINDOW_DEFAULT, ...o.window };
  const win = new THREE.Group();
  if (WINDOW.wall === "north") { win.position.set(WINDOW.a, WINDOW.y, -4.5); win.rotation.y = 0; }
  else { win.position.set(ROOM.w / 2, WINDOW.y, WINDOW.a); win.rotation.y = -Math.PI / 2; }
  const dayTex = toTexture(windowCanvas(false, o.windowStyle));
  const nightTex = toTexture(windowCanvas(true, o.windowStyle));
  const glassMat = new THREE.MeshBasicMaterial({ map: dayTex });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW.w, WINDOW.h), glassMat);
  glass.position.z = 0.004;
  glass.userData.ignoreRay = false;
  win.add(glass);
  const fr = std(o.windowFrame, 0.5);
  const fb = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fr); m.position.set(x, y, z); m.castShadow = false; win.add(m); };
  const t = 0.07, dz = 0.04;
  fb(WINDOW.w + t * 2, t, 0.09, 0, WINDOW.h / 2 + t / 2, dz);
  fb(WINDOW.w + t * 2, t, 0.09, 0, -WINDOW.h / 2 - t / 2, dz);
  fb(t, WINDOW.h + t * 2, 0.09, -WINDOW.w / 2 - t / 2, 0, dz);
  fb(t, WINDOW.h + t * 2, 0.09, WINDOW.w / 2 + t / 2, 0, dz);
  fb(0.04, WINDOW.h, 0.05, 0, 0, dz);
  fb(WINDOW.w, 0.04, 0.05, 0, 0.1, dz);
  fb(WINDOW.w + 0.3, 0.05, 0.2, 0, -WINDOW.h / 2 - t - 0.02, 0.1); // sill
  group.add(win);
  result.windowMat = glassMat;
  result.windowTextures = { day: dayTex, night: nightTex };

  // sun patch on the floor (fades at night)
  const patchMat = new THREE.MeshBasicMaterial({
    map: toTexture(sunPatchCanvas()), transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), patchMat);
  patch.rotation.set(-Math.PI / 2, 0, 0.55);
  patch.position.set(...o.patch);
  patch.scale.set(1, 1.35, 1);
  patch.userData.ignoreRay = true;
  group.add(patch);
  result.sunPatchMat = patchMat;

  // ----- pendant lamps -----
  o.pendants.forEach(([x, z]) => {
    const p = new THREE.Group();
    p.position.set(x, ROOM.h, z);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 6), std(0x20242c, 0.6));
    cord.position.y = -0.15;
    p.add(cord);
    const shade = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: o.pendant, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide })
    );
    shade.position.y = -0.33;
    shade.castShadow = false;
    p.add(shade);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd9a0, emissiveIntensity: 1, roughness: 0.4 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), bulbMat);
    bulb.position.y = -0.41;
    p.add(bulb);
    const light = new THREE.PointLight(0xffd9a6, 0, 9, 2);
    light.position.y = -0.5;
    p.add(light);
    group.add(p);
    result.pendants.push({ light, bulbMat });
  });

  return result;
}
