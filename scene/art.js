// ---------------------------------------------------------------------------
// art.js — procedural artwork drawn with the Canvas 2D API.
//
// Every wall piece gets its picture from here, so the room looks finished even
// before you add a single image. When you supply a real image (for example
// assets/textures/degree.jpg) it replaces the generated art automatically.
//
//   renderArt(item, w, h, opts)  → <canvas>
//   artTexture(item, w, h, opts) → THREE.CanvasTexture
// ---------------------------------------------------------------------------
import * as THREE from "three";

export const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
export const SANS = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
export const MONO = 'ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace';

// ---------- small helpers ---------------------------------------------------
export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return c;
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fitFont(ctx, text, maxW, startPx, weight, family, minPx = 8) {
  let px = startPx;
  do {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    px -= 1;
  } while (px > minPx);
  return px;
}

export function wrapLines(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function spaced(ctx, text, x, y, spacing) {
  // draws centred text with letter spacing
  const chars = [...text];
  let total = 0;
  const widths = chars.map((c) => ctx.measureText(c).width);
  widths.forEach((w) => (total += w + spacing));
  total -= spacing;
  let cx = x - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

export function star(ctx, cx, cy, outer, inner, points = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function glow(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace("A", String(alpha)));
  g.addColorStop(1, color.replace("A", "0"));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- individual art styles -------------------------------------------
function drawCertificate(ctx, w, h, item, opts, rnd) {
  const c = item.certificate || {};
  const heading = c.heading || item.title || "Certificate";
  const line = c.line || "";
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#fcf8ea");
  g.addColorStop(1, "#eadfbd");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // faint guilloche texture
  ctx.strokeStyle = "rgba(176,141,60,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = h / 2 + Math.sin(x * 0.03 + i * 0.5) * h * 0.38 * Math.sin(i * 0.37 + 1);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const m = w * 0.045;
  ctx.strokeStyle = "#a9822f";
  ctx.lineWidth = w * 0.014;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.strokeStyle = "#cdae61";
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  ctx.strokeRect(m * 1.65, m * 1.65, w - m * 3.3, h - m * 3.3);
  // corner flourishes
  ctx.fillStyle = "#a9822f";
  [[m * 1.65, m * 1.65, 1, 1], [w - m * 1.65, m * 1.65, -1, 1], [m * 1.65, h - m * 1.65, 1, -1], [w - m * 1.65, h - m * 1.65, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.arc(x, y, w * 0.022, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + sx * w * 0.05, y, w * 0.008, 0, Math.PI * 2);
    ctx.arc(x, y + sy * w * 0.05, w * 0.008, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#4a3a14";
  const uni = (item.subtitle || "Your University").split("·")[0].trim().toUpperCase();
  ctx.font = `600 ${w * 0.04}px ${SERIF}`;
  fitFont(ctx, uni, w * 0.7, w * 0.04, 600, SERIF);
  spaced(ctx, uni, w / 2, h * 0.2, w * 0.006);

  ctx.fillStyle = "#6a5520";
  ctx.font = `italic ${w * 0.04}px ${SERIF}`;
  ctx.fillText("hereby confers upon", w / 2, h * 0.3);

  ctx.fillStyle = "#2b2210";
  fitFont(ctx, opts.name || "Your Name", w * 0.72, w * 0.085, 700, SERIF);
  ctx.fillText(opts.name || "Your Name", w / 2, h * 0.42);
  ctx.strokeStyle = "#a9822f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.45);
  ctx.lineTo(w * 0.78, h * 0.45);
  ctx.stroke();

  ctx.fillStyle = "#3a2d0f";
  fitFont(ctx, heading, w * 0.76, w * 0.075, 700, SERIF);
  ctx.fillText(heading, w / 2, h * 0.56);
  if (line) {
    ctx.font = `italic ${w * 0.048}px ${SERIF}`;
    fitFont(ctx, line, w * 0.76, w * 0.048, 400, SERIF);
    ctx.fillText(line, w / 2, h * 0.63);
  }

  // seal
  const sx = w / 2, sy = h * 0.79, sr = w * 0.085;
  ctx.fillStyle = "#b3243b";
  ctx.beginPath();
  ctx.moveTo(sx - sr * 0.6, sy);
  ctx.lineTo(sx - sr * 1.1, sy + sr * 1.7);
  ctx.lineTo(sx - sr * 0.45, sy + sr * 1.35);
  ctx.lineTo(sx - sr * 0.1, sy + sr * 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + sr * 0.6, sy);
  ctx.lineTo(sx + sr * 1.1, sy + sr * 1.7);
  ctx.lineTo(sx + sr * 0.45, sy + sr * 1.35);
  ctx.lineTo(sx + sr * 0.1, sy + sr * 1.8);
  ctx.closePath();
  ctx.fill();
  const sg = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
  sg.addColorStop(0, "#f6e08a");
  sg.addColorStop(1, "#a9822f");
  ctx.fillStyle = sg;
  star(ctx, sx, sy, sr, sr * 0.82, 24, 0);
  ctx.fill();
  ctx.fillStyle = "#8a6a22";
  star(ctx, sx, sy, sr * 0.55, sr * 0.22, 5);
  ctx.fill();

  // signature lines
  ctx.strokeStyle = "#6a5520";
  ctx.lineWidth = 1.5;
  [[0.16, 0.34], [0.66, 0.84]].forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(w * a, h * 0.88);
    ctx.lineTo(w * b, h * 0.88);
    ctx.stroke();
  });
  ctx.fillStyle = "#6a5520";
  ctx.font = `${w * 0.026}px ${SERIF}`;
  ctx.fillText("Registrar", w * 0.25, h * 0.915);
  ctx.fillText("President", w * 0.75, h * 0.915);

  if (opts.sampleNote) {
    ctx.fillStyle = "rgba(60,40,10,0.55)";
    ctx.font = `600 ${w * 0.024}px ${SANS}`;
    ctx.fillText("SAMPLE · replace with your scan", w / 2, h * 0.968);
  }
}

function drawBrain(ctx, w, h, item, opts, rnd) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#080d1c");
  bg.addColorStop(1, "#14223f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(126,231,209,0.07)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 16; i++) {
    ctx.beginPath(); ctx.moveTo((w / 16) * i, 0); ctx.lineTo((w / 16) * i, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (h / 16) * i); ctx.lineTo(w, (h / 16) * i); ctx.stroke();
  }
  const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.86, 1);
  // skull
  let g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
  g.addColorStop(0, "#5c6579"); g.addColorStop(0.85, "#2a3144"); g.addColorStop(1, "#0b101d");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(225,230,240,0.6)";
  ctx.lineWidth = R * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.975, 0, Math.PI * 2); ctx.stroke();
  // brain tissue
  g = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 0.88);
  g.addColorStop(0, "#9aa2b4"); g.addColorStop(0.7, "#69728a"); g.addColorStop(1, "#414a60");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2); ctx.fill();
  // gyri
  for (let k = 0; k < 11; k++) {
    const r0 = R * (0.14 + k * 0.068);
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28, f1 = 5 + (k % 4), f2 = 11 + (k % 3);
    for (const pass of [0, 1]) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.03) {
        const rr = r0 * (1 + 0.055 * Math.sin(a * f1 + p1) + 0.035 * Math.sin(a * f2 + p2));
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr + pass * 1.8;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pass === 0 ? "rgba(18,22,36,0.42)" : "rgba(255,255,255,0.10)";
      ctx.lineWidth = R * 0.017;
      ctx.stroke();
    }
  }
  // midline + ventricles
  ctx.strokeStyle = "rgba(14,18,30,0.6)";
  ctx.lineWidth = R * 0.016;
  ctx.beginPath();
  for (let y = -R * 0.86; y <= R * 0.86; y += 4) {
    const x = Math.sin(y * 0.045) * R * 0.018;
    y === -R * 0.86 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(8,11,20,0.9)";
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * R * 0.1, -R * 0.04);
    ctx.rotate(s * 0.35);
    ctx.beginPath(); ctx.ellipse(0, 0, R * 0.05, R * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // lesion + segmentation overlay
  const tx = R * 0.3, ty = -R * 0.16, tr = R * 0.19;
  const p = rnd() * 6, q = rnd() * 6;
  const blob = (scale) => {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
      const rr = tr * scale * (1 + 0.16 * Math.sin(3 * a + p) + 0.09 * Math.sin(5 * a + q));
      const x = tx + Math.cos(a) * rr, y = ty + Math.sin(a) * rr;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  [[1.0, "rgba(255,92,92,0.30)", "rgba(255,120,120,0.95)"],
   [0.64, "rgba(255,214,102,0.45)", "rgba(255,225,140,0.95)"],
   [0.3, "rgba(90,200,255,0.70)", "rgba(150,225,255,1)"]].forEach(([s, fill, stroke]) => {
    blob(s); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = R * 0.012; ctx.stroke();
  });
  ctx.restore();

  // HUD
  ctx.fillStyle = "rgba(180,235,225,0.9)";
  ctx.font = `600 ${h * 0.036}px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("AXIAL · T1ce", w * 0.04, h * 0.08);
  ctx.textAlign = "right";
  ctx.fillText("SEGMENTATION OVERLAY", w * 0.96, h * 0.08);
  const legend = [["#ff7878", "edema"], ["#ffe18c", "enhancing"], ["#96e1ff", "core"]];
  ctx.textAlign = "left";
  ctx.font = `${h * 0.03}px ${MONO}`;
  legend.forEach(([c, t], i) => {
    ctx.fillStyle = c; ctx.fillRect(w * 0.04, h * (0.86 + i * 0.045) - h * 0.022, h * 0.03, h * 0.03);
    ctx.fillStyle = "rgba(220,235,240,0.85)"; ctx.fillText(t, w * 0.04 + h * 0.045, h * (0.86 + i * 0.045));
  });
  ctx.strokeStyle = "rgba(126,231,209,0.55)";
  ctx.lineWidth = 2;
  [[0.04, 0.04, 1, 1], [0.96, 0.04, -1, 1], [0.04, 0.96, 1, -1], [0.96, 0.96, -1, -1]].forEach(([a, b, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(w * a + sx * w * 0.05, h * b * 1); ctx.lineTo(w * a, h * b); ctx.lineTo(w * a, h * b + sy * h * 0.07);
    ctx.stroke();
  });
}

function drawNeural(ctx, w, h, item, opts, rnd) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0a0f22");
  bg.addColorStop(1, "#1d1247");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.75, h * 0.25, w * 0.5, "rgba(126,160,255,A)", 0.22);
  glow(ctx, w * 0.2, h * 0.85, w * 0.45, "rgba(126,231,209,A)", 0.16);
  const layers = [4, 7, 8, 6, 3];
  const cols = layers.map((n, li) => {
    const x = w * (0.13 + (li * 0.74) / (layers.length - 1));
    return Array.from({ length: n }, (_, i) => ({ x, y: h * (0.16 + ((i + 0.5) / n) * 0.66) + (rnd() - 0.5) * h * 0.02 }));
  });
  for (let li = 0; li < cols.length - 1; li++) {
    for (const a of cols[li]) for (const b of cols[li + 1]) {
      const strong = rnd() < 0.1;
      ctx.strokeStyle = strong ? "rgba(126,231,209,0.75)" : `rgba(150,170,255,${0.06 + rnd() * 0.14})`;
      ctx.lineWidth = strong ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  // attention arcs on layer 2
  ctx.strokeStyle = "rgba(255,214,120,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = cols[2][Math.floor(rnd() * cols[2].length)], b = cols[2][Math.floor(rnd() * cols[2].length)];
    if (a === b) continue;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x + w * 0.09, (a.y + b.y) / 2, b.x, b.y); ctx.stroke();
  }
  const pal = ["#7ee7d1", "#8aa4ff", "#a98bff", "#8aa4ff", "#ffd37a"];
  cols.forEach((col, li) => col.forEach((n) => {
    glow(ctx, n.x, n.y, h * 0.06, "rgba(160,190,255,A)", 0.55);
    ctx.fillStyle = pal[li];
    ctx.beginPath(); ctx.arc(n.x, n.y, h * 0.017, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
  }));
  ctx.fillStyle = "rgba(210,220,255,0.75)";
  ctx.font = `${h * 0.032}px ${MONO}`;
  ctx.textAlign = "center";
  ["input", "encoder", "attention", "decoder", "output"].forEach((t, i) => ctx.fillText(t, cols[i][0].x, h * 0.93));
}

function drawQuantum(ctx, w, h, item, opts, rnd) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#070a17");
  bg.addColorStop(1, "#1a0f3a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.8, h * 0.5, w * 0.4, "rgba(150,110,255,A)", 0.3);
  const wires = 4, x0 = w * 0.08, x1 = w * 0.6;
  const ys = Array.from({ length: wires }, (_, i) => h * (0.22 + i * 0.185));
  ctx.strokeStyle = "rgba(190,200,255,0.7)";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(220,225,255,0.9)";
  ctx.font = `${h * 0.045}px ${MONO}`;
  ctx.textAlign = "left";
  ys.forEach((y, i) => {
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.05, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillText(`q${i}`, w * 0.03, y + h * 0.015);
  });
  const gate = (x, y, label, color) => {
    const s = h * 0.085;
    ctx.fillStyle = color; rrect(ctx, x - s / 2, y - s / 2, s, s, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `700 ${s * 0.5}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText(label, x, y + s * 0.18);
  };
  const cnot = (x, yc, yt) => {
    ctx.strokeStyle = "#7ee7d1"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, yc); ctx.lineTo(x, yt); ctx.stroke();
    ctx.fillStyle = "#7ee7d1"; ctx.beginPath(); ctx.arc(x, yc, h * 0.016, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(x, yt, h * 0.04, 0, 6.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.04, yt); ctx.lineTo(x + h * 0.04, yt); ctx.moveTo(x, yt - h * 0.04); ctx.lineTo(x, yt + h * 0.04); ctx.stroke();
  };
  const cx = (i) => x0 + w * (0.12 + i * 0.1);
  gate(cx(0), ys[0], "H", "#7a5af8"); gate(cx(0), ys[2], "H", "#7a5af8");
  cnot(cx(1), ys[0], ys[1]); cnot(cx(2), ys[2], ys[3]);
  gate(cx(3), ys[1], "T", "#d6409f"); gate(cx(3), ys[3], "S", "#3b82f6");
  cnot(cx(4), ys[1], ys[0]);
  ys.forEach((y) => {
    const x = x1 - w * 0.02, s = h * 0.075;
    ctx.fillStyle = "#1f2547"; rrect(ctx, x - s / 2, y - s / 2, s, s, 6); ctx.fill();
    ctx.strokeStyle = "#ffd37a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + s * 0.12, s * 0.28, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.12); ctx.lineTo(x + s * 0.22, y - s * 0.2); ctx.stroke();
  });
  // Bloch sphere
  const bx = w * 0.8, by = h * 0.5, br = h * 0.27;
  let g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br);
  g.addColorStop(0, "rgba(160,140,255,0.35)"); g.addColorStop(1, "rgba(60,40,140,0.15)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.3); ctx.fill();
  ctx.strokeStyle = "rgba(200,190,255,0.8)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.32, 0, 0, 6.3); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(bx, by, br * 0.32, br, 0, 0, 6.3); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath(); ctx.moveTo(bx, by - br * 1.1); ctx.lineTo(bx, by + br * 1.1); ctx.moveTo(bx - br * 1.1, by); ctx.lineTo(bx + br * 1.1, by); ctx.stroke();
  ctx.fillStyle = "rgba(235,235,255,0.9)"; ctx.font = `${h * 0.05}px ${SERIF}`; ctx.textAlign = "center";
  ctx.fillText("|0⟩", bx, by - br * 1.14); ctx.fillText("|1⟩", bx, by + br * 1.28);
  const vx = bx + br * 0.55, vy = by - br * 0.5;
  ctx.strokeStyle = "#7ee7d1"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(vx, vy); ctx.stroke();
  glow(ctx, vx, vy, br * 0.22, "rgba(126,231,209,A)", 0.9);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(vx, vy, 5, 0, 6.3); ctx.fill();
}

function drawWaves(ctx, w, h, item, opts, rnd) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#06141c");
  bg.addColorStop(1, "#0d2a35");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(126,231,209,0.08)";
  for (let x = 0; x < w; x += w / 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += h / 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const pal = ["#7ee7d1", "#8aa4ff", "#ffd37a", "#ff8fa3", "#a98bff", "#9be564"];
  const n = 6;
  for (let c = 0; c < n; c++) {
    const y0 = h * (0.12 + (c + 0.5) * (0.78 / n));
    const f1 = 0.015 + rnd() * 0.03, f2 = 0.05 + rnd() * 0.07, p = rnd() * 6;
    ctx.strokeStyle = pal[c]; ctx.lineWidth = 2.2;
    ctx.shadowColor = pal[c]; ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const env = 0.5 + 0.5 * Math.sin(x * 0.006 + c);
      const y = y0 + (Math.sin(x * f1 + p) * 0.6 + Math.sin(x * f2 + p * 2) * 0.35 + (rnd() - 0.5) * 0.5) * (h * 0.045) * (0.5 + env);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(200,235,235,0.8)"; ctx.font = `${h * 0.035}px ${MONO}`; ctx.textAlign = "left";
    ctx.fillText(`ch${c + 1}`, w * 0.015, y0 - h * 0.03);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.62, 0); ctx.lineTo(w * 0.62, h); ctx.stroke();
}

function drawStage(ctx, w, h, item, opts, rnd) {
  ctx.fillStyle = "#eef1f7";
  ctx.fillRect(0, 0, w, h);
  const band = ctx.createLinearGradient(0, 0, w, 0);
  band.addColorStop(0, "#14234a");
  band.addColorStop(1, "#2f5594");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h * 0.27);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  const title = item.title || "Presentation";
  let px = fitFont(ctx, title, w * 0.88, h * 0.1, 700, SANS, h * 0.05);
  ctx.fillText(title, w * 0.06, h * 0.15);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `${h * 0.045}px ${SANS}`;
  fitFont(ctx, item.subtitle || "", w * 0.88, h * 0.045, 400, SANS, h * 0.03);
  ctx.fillText(item.subtitle || "", w * 0.06, h * 0.23);
  // bullets
  for (let i = 0; i < 4; i++) {
    const y = h * (0.4 + i * 0.12);
    ctx.fillStyle = "#2f5594"; ctx.beginPath(); ctx.arc(w * 0.075, y, h * 0.014, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#b9c2d6"; rrect(ctx, w * 0.1, y - h * 0.014, w * (0.25 + rnd() * 0.2), h * 0.028, 6); ctx.fill();
  }
  // chart
  const cx0 = w * 0.6, cy0 = h * 0.86, cw = w * 0.34, ch = h * 0.46;
  ctx.strokeStyle = "#8b95aa"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx0, cy0 - ch); ctx.lineTo(cx0, cy0); ctx.lineTo(cx0 + cw, cy0); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const bh = ch * (0.25 + rnd() * 0.7);
    const g = ctx.createLinearGradient(0, cy0 - bh, 0, cy0);
    g.addColorStop(0, i === 3 ? "#e6a23c" : "#4f7cc4"); g.addColorStop(1, i === 3 ? "#b97a14" : "#2f5594");
    ctx.fillStyle = g;
    ctx.fillRect(cx0 + cw * (0.06 + i * 0.18), cy0 - bh, cw * 0.12, bh);
  }
}

function drawBadge(ctx, w, h, item, opts, rnd) {
  const seed = hashStr(item.id || "b");
  const colors = ["#1f3b73", "#7a1f2b", "#1f6b4a", "#5b2a86", "#a14a0a"];
  const col = colors[seed % colors.length];
  // lanyard: a narrow loop from the nail (top centre) down to the clip
  ctx.strokeStyle = col;
  ctx.lineWidth = w * 0.045;
  ctx.lineCap = "butt";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + s * w * 0.012, h * 0.005);
    ctx.bezierCurveTo(w * 0.5 + s * w * 0.2, h * 0.06, w * 0.5 + s * w * 0.12, h * 0.14, w * 0.5 + s * w * 0.02, h * 0.19);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + s * w * 0.012, h * 0.005);
    ctx.bezierCurveTo(w * 0.5 + s * w * 0.2, h * 0.06, w * 0.5 + s * w * 0.12, h * 0.14, w * 0.5 + s * w * 0.02, h * 0.19);
    ctx.setLineDash([8, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // clip
  ctx.fillStyle = "#b5bac5"; rrect(ctx, w * 0.42, h * 0.17, w * 0.16, h * 0.06, 6); ctx.fill();
  // card
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#f7f8fb"; rrect(ctx, w * 0.06, h * 0.22, w * 0.88, h * 0.76, 22); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#cfd4de"; rrect(ctx, w * 0.4, h * 0.245, w * 0.2, h * 0.018, 8); ctx.fill();
  const hg = ctx.createLinearGradient(0, 0, w, 0);
  hg.addColorStop(0, col); hg.addColorStop(1, "#0d1226");
  ctx.fillStyle = hg;
  ctx.save(); rrect(ctx, w * 0.06, h * 0.29, w * 0.88, h * 0.2, 0); ctx.clip();
  ctx.fillRect(w * 0.06, h * 0.29, w * 0.88, h * 0.2); ctx.restore();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  const label = (item.short || "EVENT").toUpperCase();
  fitFont(ctx, label, w * 0.76, h * 0.062, 800, SANS, 10);
  ctx.fillText(label, w / 2, h * 0.405);
  ctx.fillStyle = "#dfe3ec";
  ctx.beginPath(); ctx.arc(w / 2, h * 0.6, w * 0.15, 0, 6.3); ctx.fill();
  ctx.fillStyle = "#aab1c1";
  ctx.beginPath(); ctx.arc(w / 2, h * 0.575, w * 0.055, 0, 6.3); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w / 2, h * 0.655, w * 0.1, w * 0.065, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#2b3347"; ctx.font = `700 ${h * 0.035}px ${SANS}`;
  ctx.fillText("ATTENDEE", w / 2, h * 0.8);
  ctx.fillStyle = "#c5cbd8"; rrect(ctx, w * 0.22, h * 0.83, w * 0.56, h * 0.02, 5); ctx.fill();
  for (let i = 0; i < 11; i++) for (let j = 0; j < 3; j++) {
    if (rnd() > 0.45) { ctx.fillStyle = "#2b3347"; ctx.fillRect(w * 0.27 + i * w * 0.045, h * 0.885 + j * h * 0.026, w * 0.035, h * 0.02); }
  }
}

function drawLaurel(ctx, w, h, item, opts, rnd) {
  const bg = ctx.createRadialGradient(w / 2, h * 0.4, w * 0.1, w / 2, h * 0.5, h * 0.75);
  bg.addColorStop(0, "#1c2c55"); bg.addColorStop(1, "#0a1226");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.43, r = w * 0.31;
  const gold = ctx.createLinearGradient(0, 0, w, h);
  gold.addColorStop(0, "#f6e08a"); gold.addColorStop(0.5, "#d4a73c"); gold.addColorStop(1, "#8f6a1c");
  for (const s of [-1, 1]) {
    for (let i = 0; i < 13; i++) {
      const t = i / 12;
      const a = Math.PI / 2 - t * Math.PI * 0.92;
      const x = cx + s * Math.cos(a) * r, y = cy + Math.sin(a) * r * 1.08;
      const tang = Math.atan2(-s * Math.sin(a) * -1, Math.cos(a)); // outward-ish
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((s > 0 ? -a : a + Math.PI) + (s > 0 ? 1 : -1) * Math.PI / 2 + side * 0.55 * s);
        ctx.fillStyle = gold;
        ctx.beginPath(); ctx.ellipse(0, -w * 0.035, w * 0.016 * (1 - t * 0.35), w * 0.05 * (1 - t * 0.3), 0, 0, 6.3); ctx.fill();
        ctx.restore();
      }
    }
  }
  ctx.fillStyle = gold;
  star(ctx, cx, cy - h * 0.02, w * 0.12, w * 0.05);
  ctx.fill();
  ctx.fillStyle = "#f3deA0";
  ctx.textAlign = "center";
  const label = item.short || item.title || "Honors";
  fitFont(ctx, label, w * 0.62, w * 0.08, 700, SERIF, 12);
  ctx.fillText(label, cx, h * 0.8);
  ctx.strokeStyle = "rgba(240,215,140,0.6)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.28, h * 0.84); ctx.lineTo(w * 0.72, h * 0.84); ctx.stroke();
  ctx.font = `${w * 0.045}px ${SERIF}`; ctx.fillStyle = "rgba(240,215,140,0.8)";
  spaced(ctx, "HONOR", cx, h * 0.9, w * 0.02);
}

const PENNANT_COLORS = ["#7a1f2b", "#1f3b73", "#1f6b4a", "#5b2a86", "#a14a0a"];
function drawPennant(ctx, w, h, item) {
  const col = PENNANT_COLORS[hashStr(item.id || "p") % PENNANT_COLORS.length];
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, col); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // felt noise
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(w * 0.09, 0, w * 0.012, h);
  ctx.textAlign = "left";
  const label = (item.short || item.title || "").toUpperCase();
  ctx.fillStyle = "#fff";
  fitFont(ctx, label, w * 0.48, h * 0.2, 800, SANS, 12);
  ctx.fillText(label, w * 0.15, h * 0.56);
  ctx.fillStyle = "#f3deA0";
  star(ctx, w * 0.04, h * 0.5, h * 0.05, h * 0.02);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = h * 0.012;
  ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.67); ctx.lineTo(w * 0.62, h * 0.67); ctx.stroke();
}

function drawTrophyHero(ctx, w, h, item) {
  const bg = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.5, h * 0.8);
  bg.addColorStop(0, "#2a2f4a"); bg.addColorStop(1, "#0a0d1a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const gold = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0);
  gold.addColorStop(0, "#8f6a1c"); gold.addColorStop(0.4, "#f6e08a"); gold.addColorStop(1, "#a97d22");
  ctx.fillStyle = gold; ctx.strokeStyle = gold;
  const cx = w / 2, s = h * 0.5, kind = item.trophy || "cup";
  if (kind === "star") {
    star(ctx, cx, h * 0.42, s * 0.5, s * 0.22); ctx.fill();
    ctx.fillRect(cx - s * 0.1, h * 0.7, s * 0.2, s * 0.14);
  } else if (kind === "medal") {
    ctx.fillStyle = "#b3243b";
    ctx.beginPath(); ctx.moveTo(cx - s * 0.28, h * 0.1); ctx.lineTo(cx, h * 0.5); ctx.lineTo(cx + s * 0.28, h * 0.1); ctx.lineTo(cx + s * 0.1, h * 0.1); ctx.lineTo(cx, h * 0.3); ctx.lineTo(cx - s * 0.1, h * 0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(cx, h * 0.58, s * 0.3, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#a97d22"; ctx.beginPath(); ctx.arc(cx, h * 0.58, s * 0.22, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#f6e08a"; star(ctx, cx, h * 0.58, s * 0.16, s * 0.07); ctx.fill();
  } else {
    const top = h * 0.2, a = s * 0.42, b = s * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - a, top);
    ctx.bezierCurveTo(cx - a, top + b * 0.6, cx - a * 0.3, top + b * 0.95, cx, top + b);
    ctx.bezierCurveTo(cx + a * 0.3, top + b * 0.95, cx + a, top + b * 0.6, cx + a, top);
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = s * 0.05;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sd * a * 1.05, top + b * 0.3, a * 0.28, b * 0.26, 0, 0, 6.3); ctx.stroke(); }
    ctx.fillRect(cx - s * 0.05, top + b, s * 0.1, s * 0.22);
    ctx.fillRect(cx - s * 0.26, top + b + s * 0.22, s * 0.52, s * 0.08);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.ellipse(cx - a * 0.45, top + b * 0.35, a * 0.12, b * 0.28, 0.1, 0, 6.3); ctx.fill();
  }
}

function drawBookCover(ctx, w, h, item) {
  const seed = hashStr(item.id || "bk");
  const hue = seed % 360;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${hue},48%,28%)`); g.addColorStop(1, `hsl(${(hue + 40) % 360},52%,16%)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, 0, w * 0.07, h);
  ctx.strokeStyle = "rgba(255,225,160,0.7)"; ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.12, h * 0.07, w * 0.8, h * 0.86);
  ctx.textAlign = "center"; ctx.fillStyle = "#f8ecc9";
  ctx.font = `700 ${w * 0.085}px ${SERIF}`;
  const lines = wrapLines(ctx, item.title || "Project", w * 0.66);
  lines.forEach((l, i) => ctx.fillText(l, w * 0.52, h * 0.38 + i * w * 0.1));
  ctx.font = `italic ${w * 0.045}px ${SERIF}`;
  ctx.fillStyle = "rgba(248,236,201,0.75)";
  fitFont(ctx, item.subtitle || "", w * 0.7, w * 0.045, 400, SERIF, 10);
  ctx.fillText(item.subtitle || "", w * 0.52, h * 0.38 + lines.length * w * 0.1 + h * 0.05);
  ctx.fillStyle = "rgba(255,225,160,0.8)"; star(ctx, w * 0.52, h * 0.8, w * 0.04, w * 0.016); ctx.fill();
}

const ICON_STYLES = {
  "icon-resume": ["#3556d6", "#6a84f0"],
  "icon-linkedin": ["#0a66c2", "#2b87e0"],
  "icon-github": ["#1b1f24", "#3b434d"],
  "icon-website": ["#0b8f84", "#1fc2b3"],
  "icon-scholar": ["#5b21b6", "#8b5cf6"],
  "icon-email": ["#d9480f", "#f98b4a"],
};

function drawIcon(ctx, w, h, item) {
  const [c1, c2] = ICON_STYLES[item.art] || ["#374151", "#6b7280"];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = w * 0.04; ctx.shadowOffsetY = w * 0.02;
  ctx.fillStyle = g; rrect(ctx, w * 0.04, w * 0.04, w * 0.92, h * 0.92, w * 0.18); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.14)"; rrect(ctx, w * 0.04, w * 0.04, w * 0.92, h * 0.42, w * 0.18); ctx.fill();
  const cx = w / 2, cy = h * 0.43, s = w * 0.3;
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff"; ctx.lineWidth = w * 0.03; ctx.lineCap = "round"; ctx.lineJoin = "round";
  switch (item.art) {
    case "icon-resume":
      ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy - s); ctx.lineTo(cx + s * 0.25, cy - s); ctx.lineTo(cx + s * 0.7, cy - s * 0.55); ctx.lineTo(cx + s * 0.7, cy + s); ctx.lineTo(cx - s * 0.7, cy + s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c1;
      [0.0, 0.3, 0.6].forEach((o) => ctx.fillRect(cx - s * 0.45, cy - s * 0.1 + s * o, s * (0.9 - o * 0.4), s * 0.1));
      ctx.beginPath(); ctx.arc(cx - s * 0.18, cy - s * 0.55, s * 0.14, 0, 6.3); ctx.fill();
      break;
    case "icon-linkedin":
      ctx.font = `800 ${w * 0.46}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("in", cx, cy + s * 0.55); break;
    case "icon-github":
      ctx.font = `700 ${w * 0.34}px ${MONO}`; ctx.textAlign = "center"; ctx.fillText("</>", cx, cy + s * 0.42); break;
    case "icon-website":
      ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.3); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.42, s, 0, 0, 6.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx - s * 0.86, cy - s * 0.5); ctx.lineTo(cx + s * 0.86, cy - s * 0.5); ctx.moveTo(cx - s * 0.86, cy + s * 0.5); ctx.lineTo(cx + s * 0.86, cy + s * 0.5); ctx.stroke();
      break;
    case "icon-scholar":
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.85); ctx.lineTo(cx + s * 1.1, cy - s * 0.25); ctx.lineTo(cx, cy + s * 0.35); ctx.lineTo(cx - s * 1.1, cy - s * 0.25); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.62, cy + s * 0.05); ctx.lineTo(cx - s * 0.62, cy + s * 0.65); ctx.quadraticCurveTo(cx, cy + s * 1.05, cx + s * 0.62, cy + s * 0.65); ctx.lineTo(cx + s * 0.62, cy + s * 0.05); ctx.lineTo(cx, cy + s * 0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + s * 1.1, cy - s * 0.25); ctx.lineTo(cx + s * 1.1, cy + s * 0.6); ctx.stroke();
      break;
    case "icon-email":
      ctx.fillRect(cx - s, cy - s * 0.65, s * 2, s * 1.35);
      ctx.strokeStyle = c1; ctx.lineWidth = w * 0.028;
      ctx.beginPath(); ctx.moveTo(cx - s, cy - s * 0.65); ctx.lineTo(cx, cy + s * 0.15); ctx.lineTo(cx + s, cy - s * 0.65); ctx.stroke();
      break;
    default:
      ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.3); ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.textAlign = "center";
  const label = (item.title || "").split(/[\s/]/)[0];
  fitFont(ctx, label, w * 0.76, w * 0.13, 700, SANS, 10);
  ctx.fillText(label, w / 2, h * 0.86);
}

function drawNameplate(ctx, w, h, item, opts) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#f2dc9a"); g.addColorStop(0.5, "#c9a24a"); g.addColorStop(1, "#8f6c22");
  ctx.fillStyle = g; rrect(ctx, 0, 0, w, h, h * 0.12); ctx.fill();
  ctx.strokeStyle = "rgba(70,48,10,0.7)"; ctx.lineWidth = h * 0.025;
  rrect(ctx, h * 0.1, h * 0.1, w - h * 0.2, h * 0.8, h * 0.06); ctx.stroke();
  ctx.fillStyle = "#3a2a08"; ctx.textAlign = "center";
  fitFont(ctx, opts.name || "Your Name", w * 0.82, h * 0.42, 700, SERIF, 12);
  ctx.fillText(opts.name || "Your Name", w / 2, h * 0.55);
  ctx.font = `${h * 0.17}px ${SERIF}`;
  fitFont(ctx, opts.headline || "", w * 0.86, h * 0.17, 400, SERIF, 8);
  ctx.fillText(opts.headline || "", w / 2, h * 0.79);
  ctx.fillStyle = "rgba(60,40,8,0.7)";
  [[0.05, 0.5], [0.95, 0.5]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(w * x, h * y, h * 0.04, 0, 6.3); ctx.fill(); });
}

const STYLES = {
  certificate: drawCertificate, brain: drawBrain, neural: drawNeural, quantum: drawQuantum, waves: drawWaves,
  stage: drawStage, badge: drawBadge, laurel: drawLaurel, pennant: drawPennant, trophy: drawTrophyHero, book: drawBookCover,
  nameplate: drawNameplate,
};

// extra art styles (see scene/artStudio.js) register themselves here
export function registerArt(name, fn) { STYLES[name] = fn; }

// ---------- public API ------------------------------------------------------
export function renderArt(item, w, h, opts = {}) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const fn = STYLES[item.art] || (item.art && item.art.startsWith("icon-") ? drawIcon : drawNeural);
  fn(ctx, canvas.width, canvas.height, item, opts, rng(hashStr(item.id || item.title || "x")));
  return canvas;
}

export function toTexture(canvas, { srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function artTexture(item, w, h, opts) {
  return toTexture(renderArt(item, w, h, opts));
}

/** Vertical title for a book spine (canvas is tall and narrow). */
export function spineCanvas(item, w = 96, h = 420) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const hue = hashStr(item.id || "bk") % 360;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, `hsl(${hue},45%,22%)`); g.addColorStop(0.5, `hsl(${hue},48%,32%)`); g.addColorStop(1, `hsl(${hue},45%,20%)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,225,160,0.85)";
  ctx.fillRect(0, h * 0.06, w, 4); ctx.fillRect(0, h * 0.94, w, 4);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f8ecc9"; ctx.textAlign = "center";
  fitFont(ctx, item.title || "Project", h * 0.78, w * 0.4, 700, SERIF, 10);
  ctx.fillText(item.title || "Project", 0, w * 0.14);
  ctx.restore();
  return canvas;
}

export function signCanvas(text, accent = "#e6c27a", pal = {}) {
  const w = 1024, h = 150;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.top || "#1b2236"); g.addColorStop(1, pal.bottom || "#0f1422");
  ctx.fillStyle = g; rrect(ctx, 6, 6, w - 12, h - 12, 26); ctx.fill();
  ctx.strokeStyle = pal.edge || "rgba(230,194,122,0.7)"; ctx.lineWidth = 4; rrect(ctx, 16, 16, w - 32, h - 32, 18); ctx.stroke();
  ctx.fillStyle = accent; ctx.textAlign = "center";
  ctx.font = `600 ${h * 0.4}px ${SERIF}`;
  spaced(ctx, text.toUpperCase(), w / 2, h * 0.64, h * 0.1);
  return canvas;
}

// ---------- environment textures --------------------------------------------
export function woodFloorCanvas(tint = { h: 25, s: 33, l: 34 }) {
  const S = 1024;
  const canvas = makeCanvas(S, S);
  const ctx = canvas.getContext("2d");
  const rnd = rng(7);
  const rows = 8, ph = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 300;
    while (x < S) {
      const len = 340 + rnd() * 380;
      const l = tint.l + rnd() * 4, hsl = `hsl(${tint.h + rnd() * 4},${tint.s + rnd() * 6}%,${l}%)`;
      ctx.fillStyle = hsl;
      ctx.fillRect(x, r * ph, len, ph);
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "50,28,10" : "255,230,190"},${0.03 + rnd() * 0.07})`;
        ctx.lineWidth = 1 + rnd() * 1.5;
        const yy = r * ph + rnd() * ph;
        ctx.beginPath(); ctx.moveTo(x, yy);
        ctx.bezierCurveTo(x + len * 0.3, yy + (rnd() - 0.5) * 6, x + len * 0.6, yy + (rnd() - 0.5) * 6, x + len, yy + (rnd() - 0.5) * 4);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,10,4,0.55)"; ctx.fillRect(x, r * ph, 2, ph);
      x += len;
    }
    ctx.fillStyle = "rgba(20,10,4,0.5)"; ctx.fillRect(0, r * ph, S, 2);
  }
  return canvas;
}

export function rugCanvas(pal = {}) {
  const P = { base: "#16294d", border: "#e6c27a", dots: "#b3453a", a: "#7ee7d1", b: "#e6c27a", ...pal };
  const W = 1024, H = 768;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = P.base; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = P.border; ctx.lineWidth = 10; ctx.strokeRect(26, 26, W - 52, H - 52);
  ctx.lineWidth = 3; ctx.strokeRect(52, 52, W - 104, H - 104);
  ctx.fillStyle = P.dots;
  for (let x = 90; x < W - 80; x += 52) {
    for (const y of [78, H - 78]) { ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill(); }
  }
  for (let y = 130; y < H - 120; y += 52) {
    for (const x of [78, W - 78]) { ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill(); }
  }
  ctx.save(); ctx.translate(W / 2, H / 2);
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 ? P.b : P.a; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -H * (0.3 - i * 0.05)); ctx.lineTo(W * (0.3 - i * 0.05), 0); ctx.lineTo(0, H * (0.3 - i * 0.05)); ctx.lineTo(-W * (0.3 - i * 0.05), 0); ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  return canvas;
}

export function windowCanvas(night, style = "city") {
  if (style === "forest") return forestWindowCanvas(night);
  const W = 512, H = 768;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const rnd = rng(night ? 3 : 4);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (night) { sky.addColorStop(0, "#04061a"); sky.addColorStop(1, "#1a2a5a"); }
  else { sky.addColorStop(0, "#8ec9ff"); sky.addColorStop(1, "#eaf6ff"); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  if (night) {
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; ctx.fillRect(rnd() * W, rnd() * H * 0.7, 1.6, 1.6); }
    glow(ctx, W * 0.72, H * 0.2, 90, "rgba(200,220,255,A)", 0.6);
    ctx.fillStyle = "#f4f7ff"; ctx.beginPath(); ctx.arc(W * 0.72, H * 0.2, 26, 0, 6.3); ctx.fill();
  } else {
    glow(ctx, W * 0.75, H * 0.16, 160, "rgba(255,248,210,A)", 0.9);
    for (let i = 0; i < 6; i++) {
      const cx = rnd() * W, cy = H * (0.1 + rnd() * 0.4);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(cx + j * 22, cy + Math.sin(j) * 8, 22 + rnd() * 10, 0, 6.3); ctx.fill(); }
    }
  }
  // skyline + trees
  ctx.fillStyle = night ? "#0a1230" : "#6e86a8";
  for (let x = 0; x < W; x += 48) { const bh = 60 + rnd() * 160; ctx.fillRect(x, H * 0.78 - bh, 40, bh + H * 0.3); }
  if (night) { ctx.fillStyle = "rgba(255,225,150,0.85)"; for (let i = 0; i < 40; i++) ctx.fillRect(rnd() * W, H * 0.5 + rnd() * H * 0.3, 4, 5); }
  ctx.fillStyle = night ? "#06102a" : "#3d7a4a";
  for (let x = 0; x < W; x += 34) { ctx.beginPath(); ctx.arc(x + 17, H * 0.9, 38 + rnd() * 20, 0, 6.3); ctx.fill(); }
  ctx.fillRect(0, H * 0.9, W, H * 0.1);
  return canvas;
}


// A misty pine-forest view for the bedroom window.
function forestWindowCanvas(night) {
  const W = 512, H = 768;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const rnd = rng(night ? 13 : 14);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (night) { sky.addColorStop(0, "#050a16"); sky.addColorStop(1, "#16283a"); }
  else { sky.addColorStop(0, "#cfe3d8"); sky.addColorStop(1, "#f3f0dc"); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  if (night) {
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; ctx.fillRect(rnd() * W, rnd() * H * 0.5, 1.6, 1.6); }
    glow(ctx, W * 0.3, H * 0.18, 100, "rgba(210,225,255,A)", 0.55);
    ctx.fillStyle = "#f4f7ff"; ctx.beginPath(); ctx.arc(W * 0.3, H * 0.18, 24, 0, 6.3); ctx.fill();
  } else {
    glow(ctx, W * 0.7, H * 0.2, 190, "rgba(255,246,205,A)", 0.85);
  }
  const pines = (baseY, size, color, count) => {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = rnd() * W, h = size * (0.7 + rnd() * 0.6), w = h * 0.38;
      for (let k = 0; k < 4; k++) {
        const ty = baseY - h + (k * h) / 4.4, tw = w * (0.45 + k * 0.28);
        ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - tw, ty + h / 3); ctx.lineTo(x + tw, ty + h / 3); ctx.closePath(); ctx.fill();
      }
      ctx.fillRect(x - 3, baseY - h * 0.1, 6, h * 0.12);
    }
  };
  pines(H * 0.62, 190, night ? "#0c1e24" : "#a9c3b0", 9);
  pines(H * 0.74, 250, night ? "#091820" : "#7aa088", 8);
  pines(H * 0.88, 330, night ? "#06121a" : "#3f6a52", 7);
  ctx.fillStyle = night ? "#050d12" : "#2c4d3a"; ctx.fillRect(0, H * 0.9, W, H * 0.1);
  if (!night) { const mist = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.8); mist.addColorStop(0, "rgba(255,255,255,0)"); mist.addColorStop(0.5, "rgba(255,255,255,0.35)"); mist.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = mist; ctx.fillRect(0, H * 0.45, W, H * 0.35); }
  return canvas;
}
