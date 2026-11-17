// ---------------------------------------------------------------------------
// door.js — a clickable wooden door with a brass sign above it. Used twice:
// the door in the office that leads to the Studio, and the one back.
//
// Local frame: origin on the floor at the door's centre, +z faces into the room.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeCanvas, rrect, spaced, fitFont, toTexture, SERIF, SANS } from "./art.js";
import { makeInteractive, hitProxy } from "../interactions/highlight.js";

export const DOOR = { w: 0.95, h: 2.12 };

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

function doorCanvas(wood) {
  const W = 512, H = 1130;
  const c = makeCanvas(W, H);
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, wood[0]); g.addColorStop(0.5, wood[1]); g.addColorStop(1, wood[0]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // grain
  for (let i = 0; i < 90; i++) {
    x.strokeStyle = `rgba(${i % 2 ? "30,16,6" : "255,225,180"},${0.04 + (i % 7) * 0.012})`;
    x.lineWidth = 1 + (i % 3);
    const px = (i * 37) % W;
    x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 14, H * 0.3, px - 12, H * 0.6, px + 6, H); x.stroke();
  }
  // raised panels
  const panel = (px, py, pw, ph) => {
    x.fillStyle = "rgba(0,0,0,0.18)"; rrect(x, px, py, pw, ph, 14); x.fill();
    x.strokeStyle = "rgba(0,0,0,0.45)"; x.lineWidth = 5; rrect(x, px, py, pw, ph, 14); x.stroke();
    x.strokeStyle = "rgba(255,235,200,0.22)"; x.lineWidth = 3; rrect(x, px + 8, py + 8, pw - 16, ph - 16, 10); x.stroke();
  };
  panel(70, 80, W - 140, 330);
  panel(70, 450, W - 140, 250);
  panel(70, 740, W - 140, 300);
  return c;
}

function signTexture(label, sub, pal) {
  const w = 1024, h = 300;
  const c = makeCanvas(w, h);
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.top); g.addColorStop(1, pal.bottom);
  x.fillStyle = g; rrect(x, 6, 6, w - 12, h - 12, 34); x.fill();
  x.strokeStyle = pal.edge; x.lineWidth = 6; rrect(x, 20, 20, w - 40, h - 40, 24); x.stroke();
  x.fillStyle = pal.ink; x.textAlign = "center";
  fitFont(x, label.toUpperCase(), w * 0.62, h * 0.3, 700, SERIF, 20);
  spaced(x, label.toUpperCase(), w / 2, h * 0.5, h * 0.05);
  x.fillStyle = pal.sub;
  fitFont(x, sub, w * 0.8, h * 0.14, 500, SANS, 12);
  x.fillText(sub, w / 2, h * 0.78);
  return c;
}

/**
 * @param {{label:string, sub?:string, wood?:string[], sign?:object}} cfg
 */
export function buildDoor(cfg) {
  const { label, sub = "", wood = ["#7b5339", "#92643f"] } = cfg;
  const pal = { top: "#1b2236", bottom: "#0f1422", edge: "rgba(230,194,122,0.8)", ink: "#e6c27a", sub: "#cdd5e6", ...(cfg.sign || {}) };
  const g = new THREE.Group();
  const { w, h } = DOOR;

  // frame
  const frame = std(0xf4f0e6, 0.5);
  const fb = (bw, bh, bd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), frame); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const t = 0.09;
  fb(w + t * 2, t, 0.1, 0, h + t / 2, 0.04);
  fb(t, h + t, 0.1, -w / 2 - t / 2, (h + t) / 2, 0.04);
  fb(t, h + t, 0.1, w / 2 + t / 2, (h + t) / 2, 0.04);

  // dark opening behind (so the door reads as recessed)
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x120d09 }));
  hole.position.set(0, h / 2, 0.004);
  g.add(hole);

  // door leaf, slightly ajar feel via a small offset
  const leafMat = new THREE.MeshStandardMaterial({ map: toTexture(doorCanvas(wood)), roughness: 0.55, emissive: 0x000000 });
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h - 0.02, 0.05), leafMat);
  leaf.position.set(0, h / 2, 0.035);
  leaf.castShadow = true;
  g.add(leaf);

  // handle + plate
  const brass = std(0xc9a24a, 0.28, 0.95);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.012), brass);
  plate.position.set(w / 2 - 0.1, 1.02, 0.07);
  g.add(plate);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), brass);
  knob.position.set(w / 2 - 0.1, 1.02, 0.1);
  knob.castShadow = true;
  g.add(knob);

  // warm light spilling under the door
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.1, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.85, toneMapped: false })
  );
  spill.position.set(0, 0.03, 0.062);
  spill.userData.ignoreRay = true;
  g.add(spill);

  // sign above
  const sw = 1.15, sh = sw * (300 / 1024);
  const signMat = new THREE.MeshStandardMaterial({ map: toTexture(signTexture(label, sub, pal)), roughness: 0.4, metalness: 0.2, emissive: 0x000000 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), signMat);
  sign.position.set(0, h + t + 0.28, 0.02);
  g.add(sign);

  const proxy = hitProxy(w + 0.4, h + 0.9, 0.2);
  proxy.position.set(0, (h + 0.9) / 2 - 0.1, 0.05);
  g.add(proxy);
  return g;
}

export { makeInteractive };
