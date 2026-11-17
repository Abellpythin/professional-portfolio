// ---------------------------------------------------------------------------
// labProps.js — science / medical set dressing for the office:
// microscope, DNA model, caduceus, test-tube rack, petri dishes, anatomical
// heart + brain, leather armchair with throw, curtains and a ceiling fan.
// All procedural, built from simple shapes. Origin is on the floor / desk top.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeCanvas, toTexture, rng } from "./art.js";

const TAU = Math.PI * 2;
export const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
function part(group, geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);
const BRASS = 0xc9a24a;

export function buildMicroscope() {
  const g = new THREE.Group();
  const white = std(0xeeeae0, 0.35, 0.1), blk = std(0x17191e, 0.4, 0.4), steel = std(0xc2c8d0, 0.3, 0.85);
  part(g, box(0.22, 0.03, 0.28), white, 0, 0.015, 0);                       // base
  const arm = part(g, box(0.05, 0.3, 0.06), white, 0, 0.18, -0.09);          // arm
  arm.rotation.x = -0.1;
  part(g, box(0.14, 0.012, 0.13), blk, 0, 0.12, 0.02);                        // stage
  part(g, box(0.06, 0.004, 0.07), std(0xdfe9ee, 0.1), 0, 0.128, 0.02);        // slide
  const head = new THREE.Group();
  head.position.set(0, 0.33, -0.06);
  head.rotation.x = 0.5;
  part(head, cyl(0.032, 0.032, 0.2, 18), blk, 0, 0.0, 0.0);                   // body tube
  [-0.045, 0.045].forEach((x) => part(head, cyl(0.016, 0.016, 0.09, 12), blk, x, 0.13, 0.0)); // eyepieces
  part(head, cyl(0.03, 0.03, 0.03, 18), steel, 0, -0.11, 0.0);               // turret
  g.add(head);
  [0, 1, 2].forEach((i) => { const o = part(g, cyl(0.012, 0.012, 0.06, 10), steel, (i - 1) * 0.026, 0.19, 0.02); o.rotation.x = 0.1; });
  part(g, cyl(0.018, 0.018, 0.03, 12), steel, 0.12, 0.15, -0.06).rotation.z = Math.PI / 2; // focus knob
  return g;
}

export function buildDNA() {
  const g = new THREE.Group();
  part(g, cyl(0.07, 0.08, 0.025, 28), std(0x14161b, 0.4, 0.5), 0, 0.0125, 0);
  const n = 22, H = 0.46;
  const a = std(0x3a9bd9, 0.3), b = std(0xe0603a, 0.3), rung = std(0xf0e6c8, 0.4);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = 0.04 + t * H, ang = t * TAU * 2.2;
    const x1 = Math.cos(ang) * 0.055, z1 = Math.sin(ang) * 0.055;
    part(g, new THREE.SphereGeometry(0.014, 10, 8), a, x1, y, z1);
    part(g, new THREE.SphereGeometry(0.014, 10, 8), b, -x1, y, -z1);
    if (i % 2 === 0) { const r = part(g, cyl(0.004, 0.004, 0.11, 6), rung, 0, y, 0, false); r.rotation.set(Math.PI / 2, 0, -ang + Math.PI / 2); r.rotation.order = "YXZ"; r.rotation.y = -ang; }
  }
  part(g, cyl(0.008, 0.008, H, 8), std(BRASS, 0.3, 0.8), 0, 0.04 + H / 2, 0, false);
  return g;
}

export function buildCaduceus() {
  const g = new THREE.Group();
  const gold = std(BRASS, 0.3, 0.9);
  part(g, cyl(0.07, 0.08, 0.03, 24), std(0x2a2118, 0.4, 0.4), 0, 0.015, 0);
  part(g, cyl(0.012, 0.012, 0.42, 10), gold, 0, 0.24, 0);
  part(g, new THREE.SphereGeometry(0.025, 12, 10), gold, 0, 0.46, 0);
  // snakes
  for (const k of [0, 1]) for (let i = 0; i < 24; i++) {
    const t = i / 23, y = 0.06 + t * 0.34, ang = t * TAU * 1.6 + k * Math.PI;
    part(g, new THREE.SphereGeometry(0.011, 8, 6), gold, Math.cos(ang) * 0.03, y, Math.sin(ang) * 0.03, false);
  }
  // wings
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 5; i++) {
      const f = part(g, new THREE.BoxGeometry(0.1 - i * 0.008, 0.012, 0.03), gold, s * (0.07 + i * 0.012), 0.44 - i * 0.016 + (i === 0 ? 0.02 : 0), 0);
      f.rotation.z = s * (0.35 - i * 0.06);
    }
  });
  return g;
}

export function buildTubeRack() {
  const g = new THREE.Group();
  const wood = std(0xb88a58, 0.55);
  part(g, box(0.24, 0.012, 0.09), wood, 0, 0.065, 0);
  part(g, box(0.24, 0.012, 0.09), wood, 0, 0.012, 0);
  [-1, 1].forEach((s) => part(g, box(0.012, 0.07, 0.09), wood, s * 0.114, 0.04, 0));
  const liq = ["#d9453a", "#e8b53a", "#4ab0d9", "#8dd16a", "#9a6ad9"];
  for (let i = 0; i < 5; i++) {
    const x = -0.09 + i * 0.045;
    part(g, new THREE.CylinderGeometry(0.0125, 0.0125, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xeaf4f8, roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false }), x, 0.1, 0, false);
    part(g, cyl(0.0105, 0.0105, 0.07, 10), std(new THREE.Color(liq[i]), 0.3), x, 0.08, 0, false);
  }
  return g;
}

export function buildPetri(color = "#d98a8a") {
  const g = new THREE.Group();
  part(g, cyl(0.07, 0.07, 0.014, 28), new THREE.MeshStandardMaterial({ color: 0xe8f3f6, roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false }), 0, 0.007, 0, false);
  part(g, cyl(0.062, 0.062, 0.006, 28), std(new THREE.Color(color), 0.4), 0, 0.006, 0, false);
  for (let i = 0; i < 6; i++) part(g, new THREE.SphereGeometry(0.008, 8, 6), std(0xf6efe6, 0.5), Math.cos(i * 1.1) * 0.03, 0.011, Math.sin(i * 1.7) * 0.03, false);
  return g;
}

export function buildVial(color = "#e8e0c8", h = 0.06) {
  const g = new THREE.Group();
  part(g, new THREE.CylinderGeometry(0.018, 0.018, h, 14), new THREE.MeshStandardMaterial({ color: 0xe8d6b0, roughness: 0.15, transparent: true, opacity: 0.6, depthWrite: false }), 0, h / 2, 0, false);
  part(g, cyl(0.014, 0.014, h * 0.6, 12), std(new THREE.Color(color), 0.4), 0, h * 0.35, 0, false);
  part(g, cyl(0.016, 0.016, 0.012, 12), std(0xffffff, 0.5), 0, h + 0.004, 0, false);
  return g;
}

export function buildHeartModel() {
  const g = new THREE.Group();
  part(g, box(0.13, 0.015, 0.1), std(0xefe9dc, 0.4), 0, 0.0075, 0);
  const red = std(0xb83a40, 0.35), vein = std(0x5a7fc2, 0.4);
  const h = part(g, new THREE.SphereGeometry(0.055, 20, 16), red, 0, 0.085, 0);
  h.scale.set(1, 1.2, 0.9);
  const h2 = part(g, new THREE.SphereGeometry(0.04, 16, 12), red, 0.025, 0.07, 0.01);
  h2.scale.set(1, 1.1, 0.9);
  part(g, cyl(0.011, 0.011, 0.07, 10), vein, -0.02, 0.15, 0.0);
  part(g, cyl(0.013, 0.013, 0.07, 10), red, 0.015, 0.16, 0.0).rotation.z = -0.25;
  part(g, cyl(0.008, 0.008, 0.05, 8), vein, 0.045, 0.14, 0.0).rotation.z = 0.5;
  return g;
}

export function buildBrainModel() {
  const g = new THREE.Group();
  part(g, box(0.16, 0.015, 0.12), std(0xefe9dc, 0.4), 0, 0.0075, 0);
  const pink = std(0xe3a39f, 0.5);
  const rnd = rng(5);
  const b = part(g, new THREE.SphereGeometry(0.07, 22, 16), pink, 0, 0.085, 0);
  b.scale.set(1.2, 0.85, 0.95);
  for (let i = 0; i < 18; i++) {
    const a = rnd() * TAU, e = rnd() * 1.2;
    const bump = part(g, new THREE.SphereGeometry(0.018, 8, 6), pink, Math.cos(a) * 0.075 * Math.cos(e) * 1.1, 0.085 + Math.sin(e) * 0.055, Math.sin(a) * 0.06 * Math.cos(e), false);
    bump.scale.set(1, 0.8, 1);
  }
  return g;
}

// A small desk keyboard (teal + cream) like in the reference
export function buildKeyboard() {
  const g = new THREE.Group();
  const c = makeCanvas(512, 180), x = c.getContext("2d");
  x.fillStyle = "#1f6b66"; x.fillRect(0, 0, 512, 180);
  const rnd = rng(9);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 15; k++) {
    const accent = (r === 0 && k < 2) || (k === 14);
    x.fillStyle = accent ? "#e0a050" : (rnd() > 0.78 ? "#2c8e86" : "#efe3c8");
    x.fillRect(12 + k * 33, 14 + r * 31, 28, 26);
  }
  const mat = new THREE.MeshStandardMaterial({ map: toTexture(c), roughness: 0.55 });
  part(g, box(0.38, 0.018, 0.13), std(0x1f6b66, 0.5), 0, 0.009, 0);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.12), mat);
  top.rotation.x = -Math.PI / 2; top.position.y = 0.0195; g.add(top);
  return g;
}

/** Leather armchair with a cream throw — faces +z. */
export function buildLeatherArmchair() {
  const g = new THREE.Group();
  const leather = std(0xa8672f, 0.55), dark = std(0x7a4a22, 0.6), wood = std(0x4a2e1e, 0.5);
  part(g, box(0.9, 0.22, 0.85), leather, 0, 0.36, 0);
  part(g, box(0.9, 0.7, 0.2), leather, 0, 0.72, -0.33).rotation.x = -0.1;
  [-1, 1].forEach((s) => part(g, box(0.16, 0.36, 0.85), dark, s * 0.5, 0.5, 0));
  part(g, box(0.78, 0.13, 0.7), std(0xb87838, 0.55), 0, 0.52, 0.05);
  [-0.4, 0.4].forEach((x) => [-0.34, 0.34].forEach((z) => part(g, cyl(0.03, 0.02, 0.2, 10), wood, x, 0.1, z)));
  const rnd = rng(3);
  const tc = makeCanvas(256, 256), tx = tc.getContext("2d");
  tx.fillStyle = "#e9dcc2"; tx.fillRect(0, 0, 256, 256);
  tx.strokeStyle = "rgba(160,130,90,0.5)"; tx.lineWidth = 3;
  for (let i = 0; i < 20; i++) { tx.beginPath(); tx.moveTo(0, i * 13 + rnd() * 3); tx.lineTo(256, i * 13 + rnd() * 3); tx.stroke(); }
  const throwM = new THREE.MeshStandardMaterial({ map: toTexture(tc), roughness: 1 });
  part(g, box(0.22, 0.07, 0.8), throwM, -0.28, 0.77, -0.28).rotation.set(-0.35, 0, 0.1);
  part(g, box(0.5, 0.05, 0.28), throwM, 0.25, 0.76, 0.12).rotation.z = 0.12;
  return g;
}

export function buildCurtain(height = 2.5) {
  const g = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0xefe2c6, roughness: 0.98, side: THREE.DoubleSide });
  for (let f = 0; f < 5; f++) part(g, box(0.07, height, 0.05), cloth, f * 0.065, 0, (f % 2) * 0.025);
  return g;
}

export function buildCeilingFan() {
  const g = new THREE.Group();
  const wood = std(0xd9c9a8, 0.6), metal = std(0x5a4a38, 0.4, 0.6);
  part(g, cyl(0.01, 0.01, 0.35, 8), metal, 0, -0.175, 0);
  part(g, cyl(0.09, 0.09, 0.08, 20), metal, 0, -0.38, 0);
  const rotor = new THREE.Group();
  rotor.position.y = -0.36;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const b = new THREE.Group();
    b.rotation.y = a;
    part(b, box(0.58, 0.012, 0.13), wood, 0.42, 0, 0, true).rotation.z = -0.06;
    part(b, box(0.1, 0.016, 0.03), metal, 0.1, 0.004, 0, false);
    rotor.add(b);
  }
  g.add(rotor);
  g.userData.rotor = rotor;
  const globe = part(g, new THREE.SphereGeometry(0.075, 18, 12, 0, TAU, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffd08a, emissiveIntensity: 0.5, roughness: 0.5, side: THREE.DoubleSide }), 0, -0.4, 0, false);
  void globe;
  return g;
}

// ---- cosy extras ----
export function buildFloorLamp() {
  const g = new THREE.Group();
  const metal = std(0x2c2c2c, 0.4, 0.6);
  part(g, cyl(0.14, 0.16, 0.025, 24), metal, 0, 0.0125, 0);
  part(g, cyl(0.012, 0.012, 1.45, 8), metal, 0, 0.74, 0);
  part(g, cyl(0.15, 0.22, 0.26, 28), new THREE.MeshStandardMaterial({ color: 0xf6e8d0, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x000000 }), 0, 1.52, 0, false);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd08a, emissiveIntensity: 0.5, roughness: 0.4 });
  part(g, new THREE.SphereGeometry(0.05, 14, 10), bulbMat, 0, 1.52, 0, false);
  const light = new THREE.PointLight(0xffc680, 0, 4.5, 2);
  light.position.y = 1.5;
  g.add(light);
  return { group: g, light, bulbMat };
}

export function buildVine(length = 1.4, seed = 3, strands = 6) {
  const g = new THREE.Group();
  const rnd = rng(seed);
  const leafGeo = new THREE.SphereGeometry(1, 8, 6);
  const mats = [0x3f7a4c, 0x2f6a41, 0x56945c, 0x2a5a3a].map((c) => std(c, 0.6));
  part(g, new THREE.SphereGeometry(0.15, 18, 12, 0, TAU, Math.PI / 2, Math.PI / 2), std(0xd8c7a6, 0.8), 0, 0, 0).rotation.x = Math.PI;
  [-1, 1].forEach((k) => part(g, cyl(0.004, 0.004, 0.5, 4), std(0x20242c, 0.6), k * 0.09, 0.25, 0).rotation.z = -k * 0.3);
  for (let s = 0; s < strands; s++) {
    const a = (s / strands) * TAU + rnd();
    const len = length * (0.55 + rnd() * 0.5);
    const n = Math.floor(len / 0.09);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const x = Math.cos(a) * (0.1 + t * 0.12) + Math.sin(i * 0.6 + s) * 0.03;
      const z = Math.sin(a) * (0.1 + t * 0.12) + Math.cos(i * 0.5 + s) * 0.03;
      const leaf = new THREE.Mesh(leafGeo, mats[(i + s) % 4]);
      leaf.scale.set(0.05 + rnd() * 0.02, 0.012, 0.07 + rnd() * 0.02);
      leaf.position.set(x, -t * len, z);
      leaf.rotation.set(rnd() * 0.8, rnd() * TAU, rnd() * 0.8);
      leaf.castShadow = true;
      g.add(leaf);
    }
    const stem = part(g, cyl(0.003, 0.003, len, 4), std(0x3a5a3a, 0.7), Math.cos(a) * 0.15, -len / 2, Math.sin(a) * 0.15, false);
    void stem;
  }
  return g;
}

export function buildFairyLights(points, { swags = 3, sag = 0.12, bulbsPerSwag = 14 } = {}) {
  const group = new THREE.Group();
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd08a, emissiveIntensity: 0.35, roughness: 0.4 });
  const geo = new THREE.SphereGeometry(0.022, 8, 6);
  const wirePts = [];
  const inst = new THREE.InstancedMesh(geo, bulbMat, swags * bulbsPerSwag * (points.length - 1));
  const m = new THREE.Matrix4();
  let idx = 0;
  for (let p = 0; p < points.length - 1; p++) {
    const a = points[p], b = points[p + 1];
    for (let s = 0; s < swags; s++) {
      for (let i = 0; i <= bulbsPerSwag; i++) {
        const t = (s + i / bulbsPerSwag) / swags;
        const u = i / bulbsPerSwag;
        const pt = new THREE.Vector3().lerpVectors(a, b, t);
        pt.y -= Math.sin(u * Math.PI) * sag;
        wirePts.push(pt.clone());
        if (i < bulbsPerSwag && idx < inst.count) { m.setPosition(pt.x, pt.y - 0.02, pt.z); inst.setMatrixAt(idx++, m); }
      }
    }
  }
  inst.count = idx;
  inst.userData.ignoreRay = true;
  group.add(inst);
  const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePts), new THREE.LineBasicMaterial({ color: 0x2a2a22 }));
  wire.userData.ignoreRay = true;
  group.add(wire);
  return { group, bulbMat };
}


// ---- soft seating ----
function knitTex(hex, seed = 4) {
  const c = makeCanvas(256, 256), x = c.getContext("2d"), r = rng(seed);
  x.fillStyle = hex; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = "rgba(0,0,0,0.16)"; x.lineWidth = 3;
  for (let i = 0; i < 16; i++) for (let j = 0; j < 22; j++) { x.beginPath(); x.moveTo(j * 12 + r() * 2, i * 16); x.lineTo(j * 12 + 6, i * 16 + 12); x.lineTo(j * 12 + 12, i * 16); x.stroke(); }
  return toTexture(c);
}

/** 3-seat fabric sofa with pillows + knit throw. Front faces +z, ~2.3 m wide. */
export function buildSofa() {
  const g = new THREE.Group();
  const fab = std(0xb9a58a, 1), fabD = std(0xa8937a, 1);
  part(g, box(2.3, 0.28, 0.95), fabD, 0, 0.2, 0);                       // base
  [-0.56, 0.56].forEach((x) => { const s = part(g, new THREE.BoxGeometry(1.1, 0.2, 0.78, 3, 2, 3), fab, x, 0.44, 0.07); s.scale.y = 1; });
  part(g, box(2.3, 0.62, 0.22), fab, 0, 0.62, -0.38).rotation.x = -0.07; // back
  [-1, 1].forEach((k) => part(g, box(0.2, 0.52, 0.95), fab, k * 1.12, 0.4, 0));    // arms
  [-1, 1].forEach((k) => [-0.38, 0.38].forEach((z) => part(g, cyl(0.03, 0.025, 0.1, 8), std(0x3a2a1c, 0.5), k * 1.05, 0.04, z)));
  const pil = (c, x, y, z, rx, ry, rz, w = 0.42, h = 0.4) => { const m = part(g, new THREE.BoxGeometry(w, h, 0.14, 4, 4, 2), new THREE.MeshStandardMaterial({ color: c, roughness: 1 }), x, y, z); m.rotation.set(rx, ry, rz); return m; };
  pil(0x6b6a42, -0.8, 0.72, -0.15, -0.35, 0.3, 0.1);
  pil(0x8a5a38, -0.5, 0.7, -0.17, -0.35, -0.2, -0.1, 0.4, 0.38);
  pil(0xb5683a, 0.85, 0.7, -0.17, -0.35, -0.3, -0.12);
  pil(0xd8c7a6, 0.55, 0.68, -0.18, -0.35, 0.15, 0.06, 0.38, 0.36);
  const tm = new THREE.MeshStandardMaterial({ map: knitTex("#c9b497"), roughness: 1 });
  part(g, box(0.5, 0.05, 0.9), tm, 0.7, 0.58, 0.12).rotation.z = 0.0;
  part(g, box(0.46, 0.05, 0.4), tm, 1.05, 0.46, 0.5).rotation.set(0.9, 0, 0.1);
  return g;
}

/** Squishy swivel chair: wide padded seat and back, sherpa seat cushion, no hard arms. Faces +z. */
export function buildComfyChair() {
  const g = new THREE.Group();
  const fab = std(0x9a8566, 1), dark = std(0x2c231b, 0.5, 0.3), sherpa = std(0xf1e8d8, 1);
  part(g, cyl(0.28, 0.3, 0.14, 24), fab, 0, 0.46, 0.02);                  // rounded seat
  part(g, cyl(0.25, 0.25, 0.05, 24), sherpa, 0, 0.55, 0.03);              // fluffy cushion
  // curved padded back: a few angled slabs
  [-0.34, -0.17, 0, 0.17, 0.34].forEach((a, i) => {
    const s = part(g, box(0.2, 0.62, 0.12), fab, Math.sin(a * 2.2) * 0.3, 0.88, -0.27 + Math.abs(a) * 0.22);
    s.rotation.y = -a * 1.5; s.rotation.x = -0.12;
  });
  [-1, 1].forEach((k) => { const arm = part(g, cyl(0.06, 0.06, 0.32, 14), fab, k * 0.33, 0.66, 0.0); arm.rotation.x = Math.PI / 2; }); // soft roll arms
  part(g, cyl(0.035, 0.035, 0.3, 12), dark, 0, 0.27, 0);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const sp = part(g, box(0.3, 0.025, 0.045), dark, Math.cos(a) * 0.15, 0.1, Math.sin(a) * 0.15); sp.rotation.y = -a; part(g, new THREE.SphereGeometry(0.035, 10, 8), dark, Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3); }
  return g;
}

export function buildPouf() {
  const g = new THREE.Group();
  part(g, cyl(0.26, 0.27, 0.34, 24), new THREE.MeshStandardMaterial({ map: knitTex("#d8c7a6", 8), roughness: 1 }), 0, 0.17, 0);
  part(g, cyl(0.26, 0.26, 0.02, 24), std(0xcbb894, 1), 0, 0.34, 0);
  return g;
}

export function buildCoffeeTable() {
  const g = new THREE.Group();
  const wood = std(0x8a5a38, 0.5), dark = std(0x3d2517, 0.6);
  part(g, cyl(0.48, 0.48, 0.045, 32), wood, 0, 0.4, 0);
  part(g, cyl(0.2, 0.2, 0.02, 24), dark, 0, 0.14, 0);
  [0, 1, 2].forEach((i) => { const a = (i / 3) * TAU + 0.5; const l = part(g, cyl(0.022, 0.016, 0.4, 8), dark, Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); });
  // books, candle, mug
  part(g, box(0.26, 0.04, 0.19), std(0x2f4a3a, 0.8), -0.1, 0.442, 0.1).rotation.y = 0.3;
  part(g, box(0.23, 0.035, 0.17), std(0xd8c7a6, 0.8), -0.1, 0.48, 0.1).rotation.y = 0.5;
  part(g, cyl(0.04, 0.04, 0.07, 18), new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 0.4, transparent: true, opacity: 0.85 }), 0.17, 0.46, -0.08);
  part(g, new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xffb347, emissiveIntensity: 2.4 }), 0.17, 0.51, -0.08, false).scale.set(1, 1.7, 1);
  return g;
}

export function buildLantern() {
  const g = new THREE.Group();
  const iron = std(0x1a1a1f, 0.4, 0.6);
  part(g, cyl(0.045, 0.05, 0.015, 12), iron, 0, 0.0075, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => part(g, box(0.006, 0.11, 0.006), iron, a * 0.04, 0.07, b * 0.04));
  part(g, cyl(0.038, 0.048, 0.015, 12), iron, 0, 0.13, 0);
  part(g, new THREE.ConeGeometry(0.05, 0.04, 12), iron, 0, 0.16, 0);
  part(g, new THREE.BoxGeometry(0.075, 0.1, 0.075), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffa94a, emissiveIntensity: 0.8, transparent: true, opacity: 0.55, depthWrite: false }), 0, 0.07, 0, false);
  part(g, cyl(0.011, 0.011, 0.04, 8), std(0xf2e6cc, 0.6), 0, 0.04, 0, false);
  part(g, new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xffb347, emissiveIntensity: 3 }), 0, 0.07, 0, false).scale.set(1, 1.7, 1);
  return g;
}

export function shagRugCanvas() {
  const W = 1024, H = 768, c = makeCanvas(W, H), x = c.getContext("2d"), r = rng(21);
  x.fillStyle = "#8a6c50"; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) {
    const shade = r();
    x.strokeStyle = shade > 0.66 ? "rgba(190,150,110,0.55)" : shade > 0.33 ? "rgba(120,88,62,0.55)" : "rgba(70,48,32,0.4)";
    x.lineWidth = 2;
    const px = r() * W, py = r() * H, a = r() * TAU;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9); x.stroke();
  }
  const g = x.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, "rgba(255,230,190,0.0)"); g.addColorStop(1, "rgba(30,15,5,0.45)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return c;
}
