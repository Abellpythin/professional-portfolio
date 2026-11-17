// ---------------------------------------------------------------------------
// decor.js — turns the ITEMS in content/portfolio.js into physical objects:
// framed degrees, research posters, conference badges, laurel plaques,
// pennants, trophies, icon tiles and the brass desk nameplate.
//
// Each section owns a fixed set of "slots" on a wall (see SLOTS below).
// Items fill the slots in the order they appear in the content file.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { artTexture, renderArt, toTexture, signCanvas, rng, hashStr } from "./art.js";
import { makeInteractive, hitProxy } from "../interactions/highlight.js";

const PPM = 560; // art texture pixels per metre
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

// ---------- wall geometry helpers ---------------------------------------------
export const WALLS = {
  north: { at: (a, y, off) => V(a, y, -4.5 + off), rotY: 0, normal: V(0, 0, 1) },
  west: { at: (a, y, off) => V(-5 + off, y, a), rotY: Math.PI / 2, normal: V(1, 0, 0) },
  east: { at: (a, y, off) => V(5 - off, y, a), rotY: -Math.PI / 2, normal: V(-1, 0, 0) },
};

export function mount(group, wall, a, y, off) {
  group.position.copy(WALLS[wall].at(a, y, off));
  group.rotation.y = WALLS[wall].rotY;
}

// ---------- slots: where each section's items go ------------------------------
const row = (wall, ys, as, w, h) => as.map((a, i) => ({ wall, a, y: Array.isArray(ys) ? ys[i] : ys, w, h }));

export const SLOTS = {
  education: row("north", 1.85, [-3.85, -2.75], 0.85, 1.15),
  research: [
    { wall: "north", a: 0, y: 2.05, w: 1.7, h: 1.15 },
    { wall: "north", a: -1.5, y: 2.05, w: 0.9, h: 1.15 },
    { wall: "north", a: 1.5, y: 2.05, w: 0.9, h: 1.15 },
  ],
  profiles: [[2.95, 2.3], [3.65, 2.3], [4.35, 2.3], [2.95, 1.62], [3.65, 1.62], [4.35, 1.62]].map(([a, y]) => ({ wall: "north", a, y, w: 0.5, h: 0.5 })),
  presentations: row("west", 1.8, [-3.3, -1.55], 1.45, 0.95),
  events: row("west", 1.75, [-0.3, 0.4, 1.1], 0.55, 0.9),
  honors: row("east", 1.75, [-3.7, -2.95, -2.2], 0.6, 0.8),
  leadership: row("east", 2.0, [-1.25, -0.5, 0.25], 0.68, 0.3),
  awards: [1.15, 1.55, 1.95, 2.35].map((a) => ({ wall: "east", a, y: 1.2, w: 0.3, h: 0.45 })),
};

const SIGNS = {
  education: { wall: "north", a: -3.3, y: 2.72, w: 1.1 },
  research: { wall: "north", a: 0, y: 2.88, w: 1.3 },
  profiles: { wall: "north", a: 3.65, y: 2.82, w: 1.0 },
  presentations: { wall: "west", a: -2.425, y: 2.55, w: 1.2 },
  events: { wall: "west", a: 0.4, y: 2.42, w: 0.95 },
  honors: { wall: "east", a: -2.95, y: 2.42, w: 1.0 },
  leadership: { wall: "east", a: -0.5, y: 2.36, w: 1.1 },
  awards: { wall: "east", a: 1.75, y: 2.0, w: 1.0 },
  projects: { wall: "west", a: 2.3, y: 2.52, w: 1.0 },
};

/** Head-on camera views for each section (used by the nav bar). */
export const ZONE_VIEWS = {
  education: { center: V(-3.3, 1.9, -4.5), normal: V(0, 0, 1), size: [2.7, 1.7] },
  research: { center: V(0, 2.0, -4.5), normal: V(0, 0, 1), size: [4.6, 1.9] },
  profiles: { center: V(3.65, 2.05, -4.5), normal: V(0, 0, 1), size: [2.3, 1.6] },
  presentations: { center: V(-5, 1.85, -2.4), normal: V(1, 0, 0), size: [3.8, 1.6] },
  events: { center: V(-5, 1.8, 0.4), normal: V(1, 0, 0), size: [2.4, 1.5] },
  honors: { center: V(5, 1.85, -2.95), normal: V(-1, 0, 0), size: [2.6, 1.4] },
  leadership: { center: V(5, 2.0, -0.5), normal: V(-1, 0, 0), size: [2.5, 1.2] },
  awards: { center: V(5, 1.55, 1.75), normal: V(-1, 0, 0), size: [2.3, 1.7] },
  projects: { center: V(-5, 1.25, 2.3), normal: V(1, 0, 0), size: [2.1, 2.7] },
};

// ---------- real-image support ------------------------------------------------
const loader = new THREE.TextureLoader();
function useRealImage(item, artMat, artMesh, w, h) {
  if (!item.image) return;
  loader.load(
    item.image,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const ar = tex.image.width / tex.image.height;
      let fw = w, fh = w / ar;
      if (fh > h) { fh = h; fw = h * ar; }
      artMesh.scale.set(fw / w, fh / h, 1);
      artMat.map = tex;
      artMat.emissiveMap = tex;
      artMat.needsUpdate = true;
    },
    undefined,
    () => console.warn(`[decor] could not load "${item.image}" — keeping generated artwork for "${item.title}".`)
  );
}

// ---------- piece builders (local origin = centre, face looks toward +z) ------
export function buildFrame(item, slot, ctx) {
  const { w, h } = slot;
  const g = new THREE.Group();
  const isCert = item.art === "certificate", isStage = item.art === "stage";
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.13, h + 0.13, 0.055), std(isCert ? 0xa57c2c : isStage ? 0xe9edf5 : 0x181b22, 0.4, isCert ? 0.6 : 0.15));
  frame.castShadow = true;
  g.add(frame);
  const matte = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.05, h + 0.05), std(isStage ? 0xffffff : 0xf3efe4, 0.9));
  matte.position.z = 0.0285;
  g.add(matte);
  const tex = artTexture(item, w * PPM, h * PPM, { name: ctx.site.name, headline: ctx.site.headline, sampleNote: !!item.image });
  const artMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.55 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), artMat);
  art.position.z = 0.0305;
  g.add(art);
  useRealImage(item, artMat, art, w, h);
  return { group: g, off: 0.0285 };
}

function buildPlaque(item, slot, ctx) {
  const { w, h } = slot;
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), std(0x4a2f1c, 0.45, 0.05));
  back.castShadow = true;
  g.add(back);
  const gold = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.03, h + 0.03), std(0xc9a24a, 0.3, 0.9));
  gold.position.z = 0.0255;
  g.add(gold);
  const tex = artTexture(item, w * PPM, h * PPM, {});
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.5 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.02, h - 0.02), mat);
  art.position.z = 0.027;
  g.add(art);
  useRealImage(item, mat, art, w - 0.02, h - 0.02);
  return { group: g, off: 0.025 };
}

function buildPennant(item, slot, ctx, index) {
  const { w, h } = slot;
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, -h / 2); shape.lineTo(0, h / 2); shape.lineTo(w, 0); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w, (pos.getY(i) + h / 2) / h);
  geo.translate(-w / 2, 0, 0);
  const tex = artTexture(item, w * PPM, h * PPM, {});
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.95, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(geo, mat);
  flag.castShadow = true;
  g.add(flag);
  const wood = std(0x7a5233, 0.5);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, h * 1.35, 10), wood);
  stick.position.set(-w / 2 - 0.012, 0, 0.004);
  g.add(stick);
  for (const s of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), std(0xc9a24a, 0.3, 0.9));
    knob.position.set(-w / 2 - 0.012, s * h * 0.675, 0.004);
    g.add(knob);
  }
  g.add(hitProxy(w + 0.1, h * 1.3, 0.05));
  g.rotation.z = (index - 1) * 0.07; // hung slightly askew, like real pennants
  const wrap = new THREE.Group();
  wrap.add(g);
  return { group: wrap, off: 0.02 };
}

function buildBadge(item, slot, ctx) {
  const { w, h } = slot;
  const g = new THREE.Group();
  const tex = artTexture(item, w * PPM * 1.2, h * PPM * 1.2, {});
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.6, transparent: true, alphaTest: 0.02 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.castShadow = true;
  g.add(plane);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), std(0xb7bcc7, 0.3, 0.9));
  nail.position.set(0, h / 2 - 0.004, 0.012);
  g.add(nail);
  return { group: g, off: 0.008 };
}

export function buildTile(item, slot, ctx) {
  const { w, h } = slot;
  const g = new THREE.Group();
  const tex = artTexture(item, 300, 300, {});
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.5, transparent: true, alphaTest: 0.02 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.castShadow = true;
  g.add(plane);
  return { group: g, off: 0.01 };
}

function buildNameplate(item, ctx) {
  const g = new THREE.Group();
  const w = 0.36, h = 0.09;
  const tex = artTexture(item, 900, 225, { name: ctx.site.name, headline: ctx.site.headline });
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.3, metalness: 0.5 });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plate.position.z = 0.012;
  plate.castShadow = true;
  g.add(plate);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, h + 0.01, 0.02), std(0x2a2a30, 0.4, 0.3));
  body.castShadow = true;
  g.add(body);
  g.add(hitProxy(w + 0.06, h + 0.06, 0.1));
  return g;
}

const GOLD = new THREE.MeshStandardMaterial({ color: 0xe0b43c, roughness: 0.25, metalness: 1 });
function buildTrophy(kind) {
  const g = new THREE.Group();
  const marble = std(0x1f232c, 0.35, 0.2);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.2), marble);
  base.position.y = 0.02;
  g.add(base);
  const part = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const starShape = (R, r) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r : R, a = Math.PI / 2 + (i * Math.PI) / 5;
      i ? s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : s.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    s.closePath();
    return s;
  };
  if (kind === "star") {
    part(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.13, 14), GOLD), 0, 0.105);
    const geo = new THREE.ExtrudeGeometry(starShape(0.15, 0.065), { depth: 0.03, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 2 });
    geo.center();
    part(new THREE.Mesh(geo, GOLD), 0, 0.3);
  } else if (kind === "medal") {
    part(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.26, 12), marble), 0, 0.17);
    const disc = part(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.016, 44), GOLD), 0, 0.3);
    disc.rotation.x = Math.PI / 2;
    const rim = part(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 8, 40), std(0xf6e08a, 0.25, 1)), 0, 0.3, 0.011);
    const em = new THREE.ExtrudeGeometry(starShape(0.055, 0.024), { depth: 0.006, bevelEnabled: false });
    em.center();
    part(new THREE.Mesh(em, std(0xf6e08a, 0.25, 1)), 0, 0.3, 0.014);
    const rb = new THREE.Shape();
    rb.moveTo(-0.075, 0.46); rb.lineTo(-0.03, 0.46); rb.lineTo(0, 0.37); rb.lineTo(0.03, 0.46); rb.lineTo(0.075, 0.46); rb.lineTo(0.0, 0.31); rb.closePath();
    part(new THREE.Mesh(new THREE.ShapeGeometry(rb), new THREE.MeshStandardMaterial({ color: 0xb3243b, roughness: 0.8, side: THREE.DoubleSide })), 0, 0, -0.012);
  } else {
    const pts = [[0, 0], [0.085, 0], [0.085, 0.02], [0.06, 0.035], [0.06, 0.07], [0.026, 0.092], [0.022, 0.15], [0.042, 0.172], [0.085, 0.208], [0.112, 0.27], [0.12, 0.34], [0, 0.34]].map(([x, y]) => new THREE.Vector2(x, y));
    part(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), GOLD), 0, 0.04);
    for (const s of [-1, 1]) {
      const handle = part(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 10, 24, Math.PI), GOLD), s * 0.118, 0.04 + 0.26);
      handle.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
  }
  const proxy = hitProxy(0.32, 0.46, 0.32);
  proxy.position.set(0, 0.23, 0);
  g.add(proxy);
  return g;
}

function buildSign(section, w) {
  const g = new THREE.Group();
  const h = w * (150 / 1024);
  const tex = toTexture(signCanvas(section.label));
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.4, metalness: 0.2 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  g.add(plane);
  g.add(hitProxy(w, h + 0.06, 0.05));
  return g;
}

// ---------- public ------------------------------------------------------------
export function pieceFromObject(item, object, { normal, size, center, focusSize }) {
  return {
    id: item.id, section: item.section, object, normal: normal.clone(), size,
    focusSize: focusSize || size,
    center: center ? center.clone() : object.position.clone(),
  };
}

/**
 * @returns {{ group:THREE.Group, pieces:Map<string,object>, signs:Map<string,object>, overflow:string[] }}
 */
export function buildDecor(items, sections, site) {
  const group = new THREE.Group();
  const pieces = new Map();
  const signs = new Map();
  const overflow = [];
  const ctx = { site };
  const counters = {};

  const finalize = (item, built, slot, wall, extra = {}) => {
    const { group: g, off } = built;
    mount(g, wall, slot.a, slot.y, off);
    makeInteractive(g, { type: "item", id: item.id, label: item.title, section: item.section });
    group.add(g);
    const normal = WALLS[wall].normal;
    pieces.set(item.id, pieceFromObject(item, g, {
      normal, size: [slot.w + 0.2, slot.h + 0.2], center: g.position.clone().addScaledVector(normal, -off), ...extra,
    }));
  };

  items.forEach((item) => {
    if (item.section === "projects") return; // placed on the bookshelf by main.js

    if (item.placement === "desk") {
      const g = buildNameplate(item, ctx);
      g.position.set(0.28, 0.835, -1.62);
      g.rotation.x = -0.22;
      g.rotation.y = 0.05;
      makeInteractive(g, { type: "item", id: item.id, label: item.title, section: item.section });
      group.add(g);
      pieces.set(item.id, pieceFromObject(item, g, { normal: V(0, 0.2, 1), size: [0.9, 0.6], center: g.position.clone() }));
      return;
    }

    const slots = SLOTS[item.section];
    if (!slots) { overflow.push(item.id); return; }
    const n = counters[item.section] = (counters[item.section] || 0);
    const slot = slots[n];
    if (!slot) { overflow.push(item.id); console.warn(`[decor] no free wall slot left in "${item.section}" for "${item.id}" — it will appear in the side panel only.`); return; }
    counters[item.section]++;

    if (item.section === "awards") {
      const g = buildTrophy(item.trophy || ["cup", "star", "medal"][n % 3]);
      const p = WALLS.east.at(slot.a, slot.y, 0.15);
      g.position.copy(p);
      g.rotation.y = -Math.PI / 2 + (rng(hashStr(item.id))() - 0.5) * 0.35;
      makeInteractive(g, { type: "item", id: item.id, label: item.title, section: item.section });
      group.add(g);
      pieces.set(item.id, pieceFromObject(item, g, {
        normal: WALLS.east.normal, size: [0.7, 0.7], center: p.clone().add(V(0, 0.22, 0)),
      }));
      return;
    }

    let built;
    switch (item.section) {
      case "profiles": built = buildTile(item, slot, ctx); break;
      case "events": built = buildBadge(item, slot, ctx); break;
      case "honors": built = buildPlaque(item, slot, ctx); break;
      case "leadership": built = buildPennant(item, slot, ctx, n); break;
      default: built = buildFrame(item, slot, ctx);
    }
    finalize(item, built, slot, slot.wall);
  });

  // trophy shelf (only if there are awards)
  if (counters.awards) {
    const shelf = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 1.95), std(0x5a3d2a, 0.5));
    board.receiveShadow = true; board.castShadow = true;
    shelf.add(board);
    for (const z of [-0.7, 0.7]) {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), std(0x2a2a30, 0.4, 0.4));
      br.position.set(-0.04, -0.07, z); br.rotation.z = 0.0;
      shelf.add(br);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), std(0x2a2a30, 0.4, 0.4));
      post.position.set(0.1, -0.06, z);
      shelf.add(post);
    }
    shelf.position.set(5 - 0.14, 1.1775, 1.75);
    group.add(shelf);
  }

  // section signs (clickable: open that whole section)
  sections.forEach((sec) => {
    const spec = SIGNS[sec.id];
    const hasItems = items.some((i) => i.section === sec.id);
    if (!spec || !hasItems) return;
    const g = buildSign(sec, spec.w);
    mount(g, spec.wall, spec.a, spec.y, 0.012);
    makeInteractive(g, { type: "section", id: sec.id, label: `${sec.label} — open section` });
    group.add(g);
    signs.set(sec.id, g);
  });

  return { group, pieces, signs, overflow };
}
