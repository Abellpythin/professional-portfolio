// ---------------------------------------------------------------------------
// cameraFocus.js — the camera "rig": fly to a piece, a wall zone, or home.
//
// Key idea: the camera is placed along the object's own facing direction
// (its normal), so frames on the left wall, the right wall and the back wall
// are all viewed head-on. When the side panel is open, the view is shifted so
// the object sits in the free part of the screen instead of behind the panel.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { tweens } from "../animations/flyTo.js";

export const DEFAULT_VIEW = {
  position: new THREE.Vector3(0, 2.05, 5.5),
  target: new THREE.Vector3(0, 1.4, -2.3),
};

export const INTRO_VIEW = {
  position: new THREE.Vector3(7.5, 5.4, 11.5),
  target: new THREE.Vector3(0, 1.2, -1.2),
};

const UP = new THREE.Vector3(0, 1, 0);

export function createCameraRig({ camera, controls, getInsets, getHome }) {
  function fly(position, target, ms = 1100, onComplete) {
    tweens.cancelGroup("cam");
    controls.enabled = false;
    controls.enableDamping = false;
    tweens.to(camera.position, { x: position.x, y: position.y, z: position.z }, ms, { group: "cam" });
    tweens.to(controls.target, { x: target.x, y: target.y, z: target.z }, ms, {
      group: "cam",
      onComplete: () => {
        controls.enabled = true;
        controls.enableDamping = true;
        onComplete && onComplete();
      },
    });
  }

  /**
   * Fly to look at something head-on.
   * @param {{center:THREE.Vector3, normal:THREE.Vector3, size:[number,number]}} view
   */
  function focus(view, { ms = 1100, fill = 0.6, minDist = 0.9, maxDist = 7 } = {}) {
    const insets = getInsets ? getInsets() : { right: 0, bottom: 0 };
    const vw = window.innerWidth, vh = window.innerHeight;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = vw / vh;
    const freeW = Math.max(0.35, (vw - insets.right) / vw);
    const freeH = Math.max(0.35, (vh - insets.bottom) / vh);
    const [w, h] = view.size;
    const t = 2 * Math.tan(fov / 2);
    const dist = THREE.MathUtils.clamp(
      Math.max(h / (fill * t * freeH), w / (fill * t * aspect * freeW)),
      minDist, maxDist
    );
    const n = view.normal.clone().normalize();
    const target = view.center.clone();
    const position = target.clone().addScaledVector(n, dist);
    position.y += Math.min(0.25, dist * 0.04);
    position.y += view.lift || 0; // optional extra height (clears furniture in front of a wall)

    // shift so the object lands in the middle of the *free* area
    const right = new THREE.Vector3().crossVectors(n.clone().negate(), UP).normalize();
    const halfH = dist * Math.tan(fov / 2);
    const halfW = halfH * aspect;
    const shiftX = (insets.right / vw) * halfW; // px fraction → world units at this distance
    const shiftY = (insets.bottom / vh) * halfH;
    position.addScaledVector(right, shiftX).addScaledVector(UP, -shiftY);
    target.addScaledVector(right, shiftX).addScaledVector(UP, -shiftY);
    fly(position, target, ms);
  }

  return {
    fly,
    focus,
    home(ms = 1100) {
      // same "make room for the panel" shift as focus(), applied to the overview
      const insets = getInsets ? getInsets() : { right: 0, bottom: 0 };
      const vw = window.innerWidth, vh = window.innerHeight;
      const base = getHome ? getHome() : DEFAULT_VIEW;
      const pos = base.position.clone(), tgt = base.target.clone();
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const halfH = pos.distanceTo(tgt) * Math.tan(fov / 2), halfW = halfH * (vw / vh);
      const dx = (insets.right / vw) * halfW, dy = (insets.bottom / vh) * halfH;
      pos.x += dx; tgt.x += dx; pos.y -= dy; tgt.y -= dy;
      fly(pos, tgt, ms);
    },
    stop() { tweens.cancelGroup("cam"); controls.enabled = true; controls.enableDamping = true; },
  };
}
