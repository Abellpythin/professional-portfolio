// ---------------------------------------------------------------------------
// soundManager.js — tiny UI sounds synthesised with the Web Audio API.
//
// No audio files are needed (and none can be "missing"). Sounds are created on
// demand after the first user gesture, which is what browsers require.
// The mute choice is remembered in localStorage when it is available.
// ---------------------------------------------------------------------------

export function createSoundManager() {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem("office-muted") === "1"; } catch (_) { /* private mode etc. */ }

  const ensure = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (_) { ctx = null; }
    return ctx;
  };

  // browsers only allow audio after a gesture; create the context then
  const unlock = () => { const c = ensure(); if (c && c.state === "suspended") c.resume(); };
  window.addEventListener("pointerdown", unlock, { once: false, passive: true });
  window.addEventListener("keydown", unlock, { once: false });

  function tone({ freq, to = freq, dur = 0.08, type = "sine", gain = 0.05, delay = 0 }) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state !== "running") return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  return {
    hover() { tone({ freq: 1500, to: 1900, dur: 0.035, gain: 0.018 }); },
    click() { tone({ freq: 520, to: 780, dur: 0.07, type: "triangle", gain: 0.06 }); tone({ freq: 1040, to: 1300, dur: 0.09, type: "sine", gain: 0.03, delay: 0.045 }); },
    whoosh() { tone({ freq: 220, to: 90, dur: 0.5, type: "sawtooth", gain: 0.012 }); },
    close() { tone({ freq: 700, to: 420, dur: 0.09, type: "triangle", gain: 0.045 }); },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem("office-muted", muted ? "1" : "0"); } catch (_) { /* ignore */ }
      if (!muted) this.click();
      return muted;
    },
    get muted() { return muted; },
  };
}
