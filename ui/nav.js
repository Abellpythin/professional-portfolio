// ---------------------------------------------------------------------------
// nav.js — section chips, hover tooltip, welcome card and help dialog.
// ---------------------------------------------------------------------------
import { h } from "./panel.js";

export function createNav({ navEl, sections, counts, rooms = [], onSection, onRoom }) {
  let current = "office";
  let list = [];
  const buttons = new Map();
  const roomOf = (s) => s.room || "office";

  function build() {
    navEl.replaceChildren();
    buttons.clear();
    list = sections.filter((s) => counts[s.id] && roomOf(s) === current);
    list.forEach((s, i) => {
      const b = h("button", { class: "chip", type: "button", "aria-current": "false", title: `${s.label} (${i + 1})`, onClick: () => onSection(s.id) },
        h("span", { "aria-hidden": "true" }, s.icon),
        s.label,
        h("span", { class: "n", "aria-hidden": "true" }, String(i + 1)));
      buttons.set(s.id, b);
      navEl.append(b);
    });
    // a chip that walks through the door to the other room
    const other = rooms.find((r) => r.id !== current);
    const here = rooms.find((r) => r.id === current);
    if (other && here) {
      navEl.append(h("button", { class: "chip door-chip", type: "button", title: `${here.door || other.label} (D)`, onClick: () => onRoom(other.id) },
        h("span", { "aria-hidden": "true" }, "🚪"),
        here.door || other.label,
        h("span", { class: "n", "aria-hidden": "true" }, "D")));
    }
  }
  build();

  return {
    get visible() { return list; },
    get room() { return current; },
    setRoom(id) { current = id; build(); },
    setActive(id) {
      buttons.forEach((b, key) => b.setAttribute("aria-current", String(key === id)));
      const b = buttons.get(id);
      if (b && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    },
  };
}

export function createTooltip(el) {
  return {
    show(title, sub, x, y) {
      el.replaceChildren(h("b", {}, title), sub ? h("span", {}, sub) : null);
      el.hidden = false;
      const w = el.offsetWidth, hgt = el.offsetHeight;
      const px = Math.min(x, window.innerWidth - w - 24);
      const py = Math.min(y, window.innerHeight - hgt - 24);
      el.style.left = px + "px";
      el.style.top = py + "px";
    },
    hide() { el.hidden = true; },
  };
}

export function createIntro({ root, site, onEnter, onTour, enterBtn, tourBtn }) {
  root.querySelector("#intro-name").textContent = site.name;
  root.querySelector("#intro-headline").textContent = site.headline;
  root.querySelector("#intro-tagline").textContent = site.tagline || "";
  const leave = (cb) => {
    root.classList.add("leaving");
    setTimeout(() => { root.hidden = true; root.classList.remove("leaving"); }, 600);
    cb && cb();
  };
  enterBtn.addEventListener("click", () => leave(onEnter));
  tourBtn.addEventListener("click", () => leave(onTour));
  return {
    show() { root.hidden = false; enterBtn.focus({ preventScroll: true }); },
    hide() { if (!root.hidden) leave(onEnter); },
    get visible() { return !root.hidden; },
  };
}
