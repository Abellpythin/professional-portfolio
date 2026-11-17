// ---------------------------------------------------------------------------
// highlight.js — makes a 3D object "clickable" and gives it a hover glow.
//
// makeInteractive(group, meta) clones the object's materials (so shared
// materials such as the wood finish never glow on other objects), tags the
// group for the raycaster, and prepares the emissive glow used on hover.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { tweens } from "../animations/flyTo.js";

const ACCENT = new THREE.Color("#7ee7d1");

export function setAccent(hex) {
  ACCENT.set(hex);
}

/** Invisible-but-clickable helper volume (makes small objects easier to hit). */
export function hitProxy(w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.userData.hitProxy = true;
  return m;
}

export function makeInteractive(group, meta) {
  group.userData = { ...(group.userData || {}), interactive: true, ...meta };
  const mats = [];
  group.traverse((o) => {
    if (!o.isMesh || o.userData.hitProxy) return;
    const clone = (m) => {
      const c = m.clone();
      if (c.emissive) {
        c.userData.baseEI = c.emissiveIntensity ?? 1;
        c.userData.baseEmissive = c.emissive.clone();
        mats.push(c);
      }
      return c;
    };
    o.material = Array.isArray(o.material) ? o.material.map(clone) : clone(o.material);
  });
  group.userData.glowMats = mats;
  group.userData.glow = { v: 0 };
  group.userData.baseScale = group.scale.clone();
  return group;
}

export function setHover(group, on) {
  const ud = group.userData;
  if (!ud || !ud.glow) return;
  tweens.to(ud.glow, { v: on ? 1 : 0 }, on ? 160 : 260, {
    key: "hover-" + (ud.id || group.uuid),
    ease: (t) => t,
    onUpdate: () => {
      const v = ud.glow.v;
      for (const m of ud.glowMats) {
        if (v > 0.001) {
          m.emissive.copy(ACCENT);
          m.emissiveIntensity = (m.userData.baseEI || 0) + v * 0.34;
        } else {
          m.emissive.copy(m.userData.baseEmissive);
          m.emissiveIntensity = m.userData.baseEI;
        }
      }
      const s = 1 + 0.035 * v;
      group.scale.set(ud.baseScale.x * s, ud.baseScale.y * s, ud.baseScale.z * s);
    },
  });
}
