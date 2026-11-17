// ---------------------------------------------------------------------------
// panel.js — the side panel (bottom sheet on phones).
//
// Three views:   index   all sections and items
//                section the items of one section, as cards
//                item    the full detail of a single item
// All content is built with DOM nodes (never innerHTML), so text from the
// content file can never inject markup.
// ---------------------------------------------------------------------------
import { renderArt } from "../scene/art.js";

const ASPECT = {
  certificate: 0.74, brain: 1.48, neural: 1.48, quantum: 1.48, waves: 1.48, stage: 1.53,
  badge: 0.61, laurel: 0.75, pennant: 2.27, trophy: 1.4, book: 0.72, nameplate: 4,
  service: 1.36, painting: 1.2, yarn: 1, landscape: 1.35, opensign: 1.6,
};

// "link" items (profiles) and "icon" items (hobbies) are drawn as a rounded app-style icon
const isIcon = (item) => item.kind === "link" || item.kind === "icon";

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export function createPanel({ els, site, sections, items, rooms = [], cb }) {
  const { root, scroll, close: closeBtn, crumbs } = els;
  const secById = Object.fromEntries(sections.map((s) => [s.id, s]));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const bySection = (id) => items.filter((i) => i.section === id);
  const artOpts = (item) => ({ name: site.name, headline: site.headline, sampleNote: !!item.image });

  let mode = "closed";
  let currentId = null;
  let staticMode = false;
  const thumbs = new Map();

  // ----- small builders -----
  const isExternal = (href) => /^https?:/i.test(href || "");
  const linkAttrs = (href) => (isExternal(href) || /\.pdf($|\?)/i.test(href || "") ? { target: "_blank", rel: "noopener noreferrer" } : {});

  function thumb(item) {
    let c = thumbs.get(item.id);
    if (!c) {
      const aspect = isIcon(item) ? 1 : ASPECT[item.art] ?? 1.4;
      let w = 152, hh = Math.round(152 / aspect);
      if (hh > 116) { hh = 116; w = Math.round(116 * aspect); }
      c = renderArt(item, w * 2, hh * 2, artOpts(item));
      c.style.width = w + "px";
      c.style.height = hh + "px";
      thumbs.set(item.id, c);
    }
    return drawCopy(c); // a fresh canvas each time (a DOM node can only live in one place)
  }
  function drawCopy(src) {
    const c = document.createElement("canvas");
    c.width = src.width; c.height = src.height;
    c.getContext("2d").drawImage(src, 0, 0);
    c.style.width = src.style.width; c.style.height = src.style.height;
    return c;
  }

  function card(item) {
    return h("button", { class: "card", type: "button", onClick: () => cb.openItem(item.id) },
      h("span", { class: "thumb" }, thumb(item)),
      h("span", {},
        h("span", { class: "c-title", style: "display:block" }, item.title),
        item.subtitle ? h("span", { class: "c-sub", style: "display:block" }, item.subtitle) : null));
  }

  function setCrumbs(parts) {
    crumbs.replaceChildren(...parts.flatMap((p, i) => {
      const node = p.onClick ? h("button", { type: "button", onClick: p.onClick }, p.label) : h("span", { class: "here" }, p.label);
      return i ? [h("span", { class: "sep", "aria-hidden": "true" }, "›"), node] : [node];
    }));
  }

  function setOpen(open) {
    root.classList.toggle("open", open);
    document.body.classList.toggle("panel-open", open);
    root.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) root.removeAttribute("inert"); else root.setAttribute("inert", "");
  }

  function finishRender(focusSel) {
    scroll.scrollTop = 0;
    const t = scroll.querySelector(focusSel || "#panel-title");
    if (t) t.focus({ preventScroll: true });
  }

  // ----- views -----
  function renderIndex() {
    mode = "index"; currentId = null;
    setCrumbs([{ label: "All content" }]);
    const head = [
      h("p", { class: "eyebrow" }, "Contents"),
      h("h2", { class: "p-title", id: "panel-title", tabindex: "-1" }, site.name),
      h("p", { class: "p-sub" }, site.headline),
    ];
    let lastRoom = null;
    const groups = sections.filter((s) => bySection(s.id).length).flatMap((s) => {
      const room = rooms.find((r) => r.id === (s.room || "office"));
      const head = rooms.length > 1 && room && room.id !== lastRoom
        ? [h("h2", { class: "room-head" }, h("span", { "aria-hidden": "true" }, room.icon), " ", room.label,
            h("button", { type: "button", class: "room-go", onClick: () => cb.goRoom && cb.goRoom(room.id) }, "Go there →"))]
        : [];
      lastRoom = room ? room.id : lastRoom;
      return [...head, h("section", { class: "index-group" },
        h("h3", {}, h("button", { type: "button", onClick: () => cb.openSection(s.id) }, `${s.icon}  ${s.label}`)),
        s.blurb ? h("p", { class: "blurb" }, s.blurb) : null,
        h("div", { class: "cards" }, bySection(s.id).map(card)))];
    });
    scroll.replaceChildren(...head, ...groups);
    finishRender();
  }

  function renderSection(id) {
    const sec = secById[id];
    if (!sec) return renderIndex();
    mode = "section"; currentId = id;
    setCrumbs([{ label: "All content", onClick: () => cb.openIndex() }, { label: sec.label }]);
    scroll.replaceChildren(
      h("p", { class: "eyebrow" }, `${sec.icon}  Section`),
      h("h2", { class: "p-title", id: "panel-title", tabindex: "-1" }, sec.label),
      sec.blurb ? h("p", { class: "p-sub" }, sec.blurb) : null,
      h("div", { class: "cards" }, bySection(id).map(card)));
    finishRender();
  }

  function renderItem(id) {
    const item = byId[id];
    if (!item) return renderIndex();
    const sec = secById[item.section] || { label: "", icon: "" };
    mode = "item"; currentId = id;
    setCrumbs([
      { label: "All content", onClick: () => cb.openIndex() },
      { label: sec.label, onClick: () => cb.openSection(item.section) },
      { label: item.title.length > 28 ? item.title.slice(0, 27) + "…" : item.title },
    ]);

    const siblings = bySection(item.section);
    const idx = siblings.findIndex((s) => s.id === id);
    const pager = siblings.length > 1
      ? h("div", { class: "p-pager" },
          h("button", { type: "button", disabled: idx <= 0, onClick: () => cb.openItem(siblings[idx - 1].id) }, "‹ Previous"),
          h("span", {}, `${idx + 1} of ${siblings.length}`),
          h("button", { type: "button", disabled: idx >= siblings.length - 1, onClick: () => cb.openItem(siblings[idx + 1].id) }, "Next ›"))
      : null;

    const parts = [];
    if (isIcon(item)) {
      const ic = renderArt(item, 192, 192, {});
      ic.className = "p-icon";
      parts.push(ic);
    }
    parts.push(
      h("p", { class: "eyebrow" }, `${sec.icon}  ${sec.label}`),
      h("h2", { class: "p-title", id: "panel-title", tabindex: "-1" }, item.title),
      item.subtitle ? h("p", { class: "p-sub" }, item.subtitle) : null,
      pager
    );

    if (!isIcon(item)) parts.push(buildHero(item));
    if (item.tags && item.tags.length) parts.push(h("div", { class: "chips" }, item.tags.map((t) => h("span", { class: "tag" }, t))));
    if (item.body && item.body.length) parts.push(h("div", { class: "p-body" }, item.body.map((p) => h("p", {}, p))));
    if (item.facts && item.facts.length) {
      parts.push(h("dl", { class: "facts" }, item.facts.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])));
    }
    if (item.entries && item.entries.length) {
      const title = { research: "Publications & outputs", leadership: "Highlights", presentations: "Details" }[item.section] || "Details";
      parts.push(
        h("h3", { class: "p-section-title" }, title),
        h("ul", { class: "entries" }, item.entries.map((e) => h("li", {},
          e.href && e.href !== "#" ? h("a", { class: "e-title", href: e.href, ...linkAttrs(e.href) }, e.title) : h("div", { class: "e-title" }, e.title),
          e.meta ? h("div", { class: "e-meta" }, e.meta) : null,
          e.text ? h("div", { class: "e-text" }, e.text) : null))));
    }
    if (item.gallery && item.gallery.length) {
      parts.push(h("h3", { class: "p-section-title" }, "Gallery"),
        h("div", { class: "gallery" }, item.gallery.map((g) =>
          h("button", { type: "button", "aria-label": `Enlarge: ${g.caption || item.title}`, onClick: () => cb.lightbox(g.src, g.caption || item.title) },
            h("img", { src: g.src, alt: g.caption || "", loading: "lazy" })))));
    }

    const actions = [];
    if (item.kind === "link" && item.href) {
      actions.push(h("a", { class: "btn primary", href: item.href, ...linkAttrs(item.href) }, `${item.cta || "Open"} ↗`));
    }
    (item.links || []).forEach((l) => actions.push(h("a", { class: "btn", href: l.href, ...linkAttrs(l.href) }, l.label)));
    if (actions.length) parts.push(h("div", { class: "actions" }, actions));

    if (site.showPlaceholderNotes && item.placeholder !== false) {
      parts.push(h("p", { class: "placeholder-note" }, "Placeholder content. Edit the item with id ", h("code", {}, item.id), " in content/portfolio.js."));
    }
    scroll.replaceChildren(...parts.filter(Boolean));
    finishRender();
  }

  function buildHero(item) {
    const aspect = ASPECT[item.art] ?? 1.4;
    const make = (w) => renderArt(item, w, Math.round(w / aspect), artOpts(item));
    const canvas = make(720);
    const btn = h("button", { class: "hero-btn", type: "button", "aria-label": `Enlarge: ${item.title}` }, canvas);
    let kind = "art";
    btn.addEventListener("click", () => {
      cb.lightbox(kind === "image" ? item.image : make(1700).toDataURL("image/png"), item.title);
    });
    if (item.image) {
      const img = new Image();
      img.alt = item.title;
      img.onload = () => { kind = "image"; btn.replaceChildren(img); };
      img.src = item.image; // on error we simply keep the generated artwork
    }
    return h("figure", { class: "p-hero" }, btn);
  }

  // ----- public -----
  closeBtn.addEventListener("click", () => cb.close());

  return {
    showIndex() { renderIndex(); setOpen(true); },
    showSection(id) { renderSection(id); setOpen(true); },
    showItem(id) { renderItem(id); setOpen(true); },
    close() { mode = "closed"; currentId = null; if (!staticMode) setOpen(false); },
    setStatic(v) { staticMode = v; if (v) { closeBtn.hidden = true; } },
    get isOpen() { return mode !== "closed"; },
    get mode() { return mode; },
    get currentId() { return currentId; },
    /** Pixels of the screen the panel covers, used to offset the camera. */
    insets() {
      if (mode === "closed" || staticMode) return { right: 0, bottom: 0 };
      if (window.innerWidth <= 760) return { right: 0, bottom: Math.round(window.innerHeight * 0.58) };
      return { right: Math.min(440, window.innerWidth - 28) + 24, bottom: 0 };
    },
  };
}
