// ---------------------------------------------------------------------------
// furniture.js — procedural desk, chairs, monitor, lamp and plants.
// Everything is built from primitives, so the room works with zero model
// files. (Optional .glb extras are loaded separately — see loaders/.)
// ---------------------------------------------------------------------------
import * as L from "./labProps.js";
import * as THREE from "three";
import { renderArt, makeCanvas, rng } from "./art.js";

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

// ---------- desk ------------------------------------------------------------
function buildDesk() {
  const g = new THREE.Group();
  const wood = std(0x8a5a38, 0.38, 0.02);
  const dark = std(0x3d2517, 0.6);
  g.add(mesh(new THREE.BoxGeometry(2.1, 0.05, 0.95), wood, 0, 0.745, 0));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.72, 0.9), dark, -0.98, 0.36, 0));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.72, 0.9), dark, 0.98, 0.36, 0));
  g.add(mesh(new THREE.BoxGeometry(1.92, 0.46, 0.03), wood, 0, 0.5, 0.4));          // modesty panel (visitor side)
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.66, 0.78), dark, 0.62, 0.35, -0.02));     // drawer cabinet
  for (let i = 0; i < 3; i++) {
    g.add(mesh(new THREE.BoxGeometry(0.56, 0.18, 0.02), wood, 0.62, 0.17 + i * 0.21, -0.42));
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.014, 0.02), std(0xc9a24a, 0.3, 0.9), 0.62, 0.17 + i * 0.21, -0.44, false));
  }
  // brass inlay on the visitor-facing panel
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.012, 0.005), std(0xc9a24a, 0.3, 0.9), 0, 0.5, 0.418, false));
  // desk mat
  const mat = mesh(new THREE.BoxGeometry(1.35, 0.006, 0.5), std(0xa86f3c, 0.7), -0.2, 0.773, -0.12, false);
  g.add(mat);
  return g;
}

// ---------- monitor with an animated screen ----------------------------------
function buildMonitor() {
  const g = new THREE.Group();
  const black = std(0x15171c, 0.4, 0.3);
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.016, 28), black, 0, 0.008, 0));
  g.add(mesh(new THREE.BoxGeometry(0.035, 0.24, 0.025), black, 0, 0.13, -0.01));
  g.add(mesh(new THREE.BoxGeometry(0.72, 0.43, 0.03), black, 0, 0.4, 0));
  const canvas = makeCanvas(512, 304);
  const ctx = canvas.getContext("2d");
  const base = renderArt({ art: "brain", id: "monitor-scan" }, 512, 304);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.4), screenMat);
  screen.position.set(0, 0.4, 0.0158);
  g.add(screen);
  g.rotation.x = -0.03;
  let last = 0;
  const update = (now) => {
    if (now - last < 80) return;
    last = now;
    ctx.drawImage(base, 0, 0);
    const y = ((now * 0.00018) % 1) * canvas.height;
    const sg = ctx.createLinearGradient(0, y - 26, 0, y + 6);
    sg.addColorStop(0, "rgba(126,231,209,0)"); sg.addColorStop(1, "rgba(126,231,209,0.38)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, y - 26, canvas.width, 32);
    ctx.fillStyle = "rgba(126,231,209,0.9)";
    ctx.fillRect(0, y + 5, canvas.width, 2);
    tex.needsUpdate = true;
  };
  update(1e6);
  return { group: g, update, screenMat };
}

// ---------- chairs ----------------------------------------------------------
function buildOfficeChair() {
  const g = new THREE.Group();
  const fabric = std(0x4a2e22, 0.7);
  const black = std(0x16181d, 0.5, 0.3);
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.09, 0.5), fabric, 0, 0.5, 0));
  const back = mesh(new THREE.BoxGeometry(0.5, 0.58, 0.07), fabric, 0, 0.88, -0.24);
  back.rotation.x = -0.1;
  g.add(back);
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.34), black, s * 0.29, 0.69, -0.02));
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), black, s * 0.29, 0.59, -0.02));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12), black, 0, 0.3, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = mesh(new THREE.BoxGeometry(0.3, 0.025, 0.04), black, Math.cos(a) * 0.15, 0.1, Math.sin(a) * 0.15);
    spoke.rotation.y = -a;
    g.add(spoke);
    g.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), black, Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3));
  }
  return g;
}

export function buildGuestChair() {
  const g = new THREE.Group();
  const wood = std(0x8a6444, 0.55);
  const seat = std(0x1f6b66, 0.7);
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.48), seat, 0, 0.45, 0));
  for (const x of [-0.22, 0.22]) for (const z of [-0.2, 0.2]) g.add(mesh(new THREE.BoxGeometry(0.045, 0.45, 0.045), wood, x, 0.225, z));
  for (const x of [-0.22, 0.22]) g.add(mesh(new THREE.BoxGeometry(0.045, 0.45, 0.045), wood, x, 0.68, -0.2));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.18, 0.04), seat, 0, 0.78, -0.2));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.05, 0.04), wood, 0, 0.9, -0.2));
  return g;
}

// ---------- desk lamp -------------------------------------------------------
export function buildLamp() {
  const g = new THREE.Group();
  const metal = std(0x2a6f66, 0.35, 0.6);
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.02, 24), metal, 0, 0.01, 0));
  const arm1 = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.34, 8), metal, 0.05, 0.19, 0);
  arm1.rotation.z = -0.3;
  g.add(arm1);
  const arm2 = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.32, 8), metal, -0.0, 0.43, 0);
  arm2.rotation.z = 0.9;
  g.add(arm2);
  const shade = mesh(new THREE.CylinderGeometry(0.035, 0.1, 0.12, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f5b4a, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), -0.14, 0.52, 0);
  shade.rotation.z = 0.25;
  g.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd08a, emissiveIntensity: 0.6, roughness: 0.4 });
  const bulb = mesh(new THREE.SphereGeometry(0.035, 16, 12), bulbMat, -0.145, 0.49, 0, false);
  g.add(bulb);
  const light = new THREE.PointLight(0xffc680, 0, 5, 2);
  light.position.set(-0.15, 0.46, 0.02);
  g.add(light);
  return { group: g, light, bulbMat };
}

// ---------- plant -----------------------------------------------------------
export function buildPlant(scale = 1, seed = 5) {
  const g = new THREE.Group();
  const rnd = rng(seed);
  const pot = mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 28), std(0xb5663a, 0.8), 0, 0.18, 0);
  g.add(pot);
  g.add(mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 28), std(0xa55a32, 0.8), 0, 0.36, 0).rotateX(Math.PI / 2));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), std(0x2b2018, 1), 0, 0.35, 0, false));
  const greens = [0x2f7d46, 0x3a9255, 0x26683c].map((c) => std(c, 0.55));
  const geo = new THREE.SphereGeometry(1, 12, 8);
  const stem = mesh(new THREE.CylinderGeometry(0.012, 0.02, 1.0, 8), std(0x5a4430, 0.8), 0, 0.85, 0);
  g.add(stem);
  for (let i = 0; i < 28; i++) {
    const h = 0.55 + rnd() * 0.85;
    const a = rnd() * Math.PI * 2;
    const r = 0.07 + (h - 0.4) * 0.16;
    const leaf = new THREE.Mesh(geo, greens[Math.floor(rnd() * 3)]);
    leaf.scale.set(0.05 + rnd() * 0.03, 0.2 + rnd() * 0.1, 0.12 + rnd() * 0.04);
    leaf.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
    leaf.rotation.set(Math.sin(a) * 0.9, -a, -Math.cos(a) * 0.9);
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

// ---------- assemble --------------------------------------------------------
export function buildFurniture() {
  const group = new THREE.Group();

  const desk = buildDesk();
  desk.position.set(0, 0, -2.0);
  group.add(desk);

  const monitor = buildMonitor();
  monitor.group.position.set(-0.5, 0.775, -2.12);
  group.add(monitor.group);

  const lamp = buildLamp();
  lamp.group.position.set(0.84, 0.775, -2.28);
  group.add(lamp.group);

  // desk dressing: keyboard, microscope, DNA model, caduceus, samples, anatomical models
  const put = (obj, x, y, z, r = 0) => { obj.position.set(x, y, z); obj.rotation.y = r; group.add(obj); return obj; };
  put(L.buildKeyboard(), -0.5, 0.776, -1.88, 0.0);
  const mouse = mesh(new THREE.SphereGeometry(0.03, 14, 10), std(0xefe9dc, 0.4), -0.15, 0.79, -1.88);
  mouse.scale.set(0.8, 0.5, 1.2);
  group.add(mouse);
  put(L.buildMicroscope(), -0.9, 0.775, -1.85, 0.5);
  put(L.buildDNA(), 0.06, 0.775, -2.3);
  put(L.buildCaduceus(), 0.42, 0.775, -2.33);
  put(L.buildTubeRack(), 0.36, 0.775, -1.78, -0.2);
  put(L.buildPetri("#d98a8a"), 0.62, 0.775, -1.72);
  put(L.buildPetri("#9fcf8a"), 0.76, 0.775, -1.86);
  put(L.buildVial("#e8b53a"), 0.9, 0.775, -1.75);
  put(L.buildVial("#d9453a", 0.07), 0.95, 0.775, -1.68);
  put(L.buildHeartModel(), 0.9, 0.775, -2.05, -0.4);
  put(L.buildBrainModel(), -0.92, 0.775, -2.3, 0.3);
  const notebook = mesh(new THREE.BoxGeometry(0.22, 0.022, 0.3), std(0xf4f0e2, 0.9), 0.25, 0.786, -1.62);
  notebook.rotation.y = 0.35;
  group.add(notebook);
  group.add(mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.09, 20), std(0xf2f2f2, 0.35), 0.1, 0.82, -1.7));

  // owner chair, pushed back and swivelled slightly
  const chair = L.buildComfyChair();
  chair.position.set(-0.1, 0, -3.2);
  chair.rotation.y = 0.45;
  group.add(chair);

  // cosy corner: sofa along the west wall, coffee table, pouf, floor lamp
  const sofa = L.buildSofa();
  sofa.position.set(-4.35, 0, -0.95);
  sofa.rotation.y = Math.PI / 2;
  group.add(sofa);
  const table = L.buildCoffeeTable();
  table.position.set(-2.85, 0, -0.95);
  group.add(table);
  const floorLamp = L.buildFloorLamp();
  floorLamp.group.position.set(-4.55, 0, 0.55);
  group.add(floorLamp.group);
  const lantern = L.buildLantern();
  lantern.position.set(-0.95, 0.775, -2.55);
  group.add(lantern);

  // string lights and a trailing plant
  const fl = L.buildFairyLights([new THREE.Vector3(-4.95, 2.97, -4.46), new THREE.Vector3(-2.5, 2.97, -4.46), new THREE.Vector3(2.5, 2.97, -4.46), new THREE.Vector3(4.95, 2.97, -4.46)], { swags: 3, sag: 0.07 });
  fl.bulbMat.emissiveIntensity = 0.9;
  group.add(fl.group);
  const fl2 = L.buildFairyLights([new THREE.Vector3(-4.96, 2.97, -4.4), new THREE.Vector3(-4.96, 2.97, 3.4)], { swags: 4, sag: 0.07 });
  fl2.group.traverse((o) => { if (o.isInstancedMesh) o.material = fl.bulbMat; });
  group.add(fl2.group);
  const vine = L.buildVine(1.1, 7, 6); vine.position.set(-4.7, 2.95, -4.1); group.add(vine);

  const fan = L.buildCeilingFan();
  fan.position.set(0, 3.0, -0.95);
  group.add(fan);

  // plants
  const p1 = buildPlant(1.1, 3); p1.position.set(-4.4, 0, -4.0); group.add(p1);
  const p2 = buildPlant(0.9, 9); p2.position.set(4.4, 0, -4.05); group.add(p2);
  const p3 = buildPlant(0.6, 12); p3.position.set(3.9, 0, 2.8); group.add(p3);

  return { group, monitor, lamp, fan, extraLamps: [floorLamp] };
}
