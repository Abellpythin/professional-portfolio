// ---------------------------------------------------------------------------
// flyTo.js — tiny dependency-free tween engine.
//
// One shared `tweens` instance is updated once per frame from main.js, so every
// animation (camera moves, day/night, book pull-out, hover glow) runs on the
// same clock and can be cancelled by key or group. Starting a new camera move
// cancels the previous one instead of fighting it.
// ---------------------------------------------------------------------------

export const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export class Tweener {
  constructor() {
    this.active = new Set();
    this.reduceMotion = false;
    try {
      this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) { /* ignore */ }
  }

  /**
   * Animate numeric properties of `target` to the values in `props`.
   * @param {object} target   any object (Vector3, Color, light, plain {t:0}…)
   * @param {object} props    e.g. { x: 1, y: 2 }
   * @param {number} ms       duration in milliseconds
   * @param {object} [o]
   * @param {(t:number)=>number} [o.ease]
   * @param {string} [o.key]        a new tween with the same key replaces the old one
   * @param {string} [o.group]      lets cancelGroup() stop several tweens at once
   * @param {number} [o.delay]
   * @param {()=>void} [o.onUpdate]
   * @param {()=>void} [o.onComplete]
   */
  to(target, props, ms = 800, o = {}) {
    if (o.key) this.cancel(o.key);
    const from = {};
    for (const k of Object.keys(props)) from[k] = target[k];
    const tw = {
      target, props, from,
      ms: this.reduceMotion ? 1 : Math.max(1, ms),
      ease: o.ease || ease.inOutCubic,
      key: o.key, group: o.group,
      delay: o.delay || 0,
      start: performance.now(),
      onUpdate: o.onUpdate, onComplete: o.onComplete,
    };
    this.active.add(tw);
    return tw;
  }

  cancel(key) {
    for (const tw of this.active) if (tw.key === key) this.active.delete(tw);
  }

  cancelGroup(group) {
    for (const tw of this.active) if (tw.group === group) this.active.delete(tw);
  }

  update(now = performance.now()) {
    for (const tw of [...this.active]) {
      if (!this.active.has(tw)) continue; // cancelled by an earlier callback this frame
      const elapsed = now - tw.start - tw.delay;
      if (elapsed < 0) continue;
      const t = Math.min(1, elapsed / tw.ms);
      const e = tw.ease(t);
      for (const k of Object.keys(tw.props)) {
        tw.target[k] = tw.from[k] + (tw.props[k] - tw.from[k]) * e;
      }
      if (tw.onUpdate) tw.onUpdate();
      if (t >= 1) {
        this.active.delete(tw);
        if (tw.onComplete) tw.onComplete();
      }
    }
  }
}

export const tweens = new Tweener();

/** Convenience: tween a THREE.Vector3 (or anything with x/y/z). */
export function tweenVec3(vec, to, ms, o) {
  return tweens.to(vec, { x: to.x, y: to.y, z: to.z }, ms, o);
}
