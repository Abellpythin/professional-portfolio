// ---------------------------------------------------------------------------
// dayNight.js — animated day ⇄ night transition.
//
// One number `t` (0 = day, 1 = night) drives everything: sky colour, sun and
// moon light, ambient fill, window picture, pendant + desk lamps, reflections
// and bloom. Edit the DAY / NIGHT tables to restyle either mood.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { tweens } from "../animations/flyTo.js";

const C = (h) => new THREE.Color(h);

export const DAY = {
  bg: C(0xcdb9a0), exposure: 0.95, ambient: 0.4, ambientColor: C(0xffe2c0),
  hemi: 0.7, hemiSky: C(0xffe9c8), hemiGround: C(0x8a7058),
  sun: 2.2, sunColor: C(0xffdcae),
  pendant: 2.6, bulb: 1.3, lamp: 2.4, lampBulb: 1.4,
  patch: 0.2, bloom: 0, env: 0.85, ceiling: 1,
};

export const NIGHT = {
  bg: C(0x060913), exposure: 0.95, ambient: 0.12, ambientColor: C(0x7f8cff),
  hemi: 0.22, hemiSky: C(0x4a5a9a), hemiGround: C(0x1a1420),
  sun: 0.5, sunColor: C(0x93a8ff),
  pendant: 7, bulb: 2.2, lamp: 5.5, lampBulb: 3,
  patch: 0, bloom: 0.5, env: 0.2, ceiling: 0.1,
};

export function createDayNight({ scene, renderer, lights, room, lamp, extraRooms = [], extraLamps = [], bloomPass, initialNight = false }) {
  const rooms = [room, ...extraRooms];
  const lampList = [lamp, ...extraLamps];
  const { ambient, hemi, sun } = lights;
  const state = { t: initialNight ? 1 : 0 };
  let envMats = [];

  const lerp = (a, b, t) => a + (b - a) * t;
  const tmp = new THREE.Color();

  function refreshMaterials() {
    envMats = [];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m && m.isMeshStandardMaterial) envMats.push(m); });
    });
    apply(state.t);
  }

  function apply(t) {
    scene.background.copy(DAY.bg).lerp(NIGHT.bg, t);
    if (scene.fog) scene.fog.color.copy(scene.background);
    renderer.toneMappingExposure = lerp(DAY.exposure, NIGHT.exposure, t);
    ambient.intensity = lerp(DAY.ambient, NIGHT.ambient, t);
    ambient.color.copy(DAY.ambientColor).lerp(NIGHT.ambientColor, t);
    hemi.intensity = lerp(DAY.hemi, NIGHT.hemi, t);
    hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, t);
    hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, t);
    sun.intensity = lerp(DAY.sun, NIGHT.sun, t);
    sun.color.copy(DAY.sunColor).lerp(NIGHT.sunColor, t);
    rooms.forEach((r) => {
      r.pendants.forEach((p) => {
        p.light.intensity = lerp(DAY.pendant, NIGHT.pendant, t);
        p.bulbMat.emissiveIntensity = lerp(DAY.bulb, NIGHT.bulb, t);
      });
      r.ceilingMat.emissiveIntensity = lerp(DAY.ceiling, NIGHT.ceiling, t);
      r.sunPatchMat.opacity = lerp(DAY.patch, NIGHT.patch, t);
      r.windowMat.map = t > 0.5 ? r.windowTextures.night : r.windowTextures.day;
    });
    lampList.forEach((l) => {
      l.light.intensity = lerp(DAY.lamp, NIGHT.lamp, t);
      l.bulbMat.emissiveIntensity = lerp(DAY.lampBulb, NIGHT.lampBulb, t);
    });
    const e = lerp(DAY.env, NIGHT.env, t);
    envMats.forEach((m) => (m.envMapIntensity = e));
    if (bloomPass) bloomPass.strength = lerp(DAY.bloom, NIGHT.bloom, t);
  }

  function set(night, animate = true) {
    tweens.to(state, { t: night ? 1 : 0 }, animate ? 1400 : 1, {
      key: "daynight",
      onUpdate: () => apply(state.t),
      onComplete: () => apply(state.t),
    });
  }

  apply(state.t);

  return {
    state,
    set,
    toggle() { const night = state.t < 0.5; set(night); return night; },
    refreshMaterials,
    get isNight() { return state.t >= 0.5; },
    get bloomActive() { return state.t > 0.02; },
  };
}
