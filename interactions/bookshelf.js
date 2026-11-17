// ---------------------------------------------------------------------------
// bookshelf.js — a real-looking bookshelf whose project "books" slide out when
// selected. Local frame: origin on the floor at the shelf's centre, +z faces
// into the room. main.js rotates/positions the whole group against a wall.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { tweens, ease } from "../animations/flyTo.js";
import { spineCanvas, toTexture, rng } from "../scene/art.js";
import { makeInteractive } from "./highlight.js";

export const SHELF = { width: 1.7, height: 2.25, depth: 0.42 };
const BOARDS = [0.12, 0.56, 0.99, 1.42, 1.85]; // y of each shelf top surface
const BOOK_PULL = 0.3;

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export function createBookshelf(projectItems, { onBookMesh } = {}) {
  const group = new THREE.Group();
  const wood = std(0x5a3d2a, 0.55);
  const woodDark = std(0x3f291b, 0.7);
  const { width: W, height: H, depth: D } = SHELF;
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  // carcass
  add(new THREE.BoxGeometry(0.04, H, D), wood, -W / 2 + 0.02, H / 2, 0);
  add(new THREE.BoxGeometry(0.04, H, D), wood, W / 2 - 0.02, H / 2, 0);
  add(new THREE.BoxGeometry(W, 0.05, D), wood, 0, H - 0.025, 0);
  add(new THREE.BoxGeometry(W - 0.08, 0.1, D - 0.04), woodDark, 0, 0.05, 0);
  add(new THREE.BoxGeometry(W - 0.08, H - 0.1, 0.02), woodDark, 0, H / 2, -D / 2 + 0.01);
  BOARDS.forEach((y) => add(new THREE.BoxGeometry(W - 0.08, 0.035, D - 0.03), wood, 0, y - 0.0175, 0.005));

  const rnd = rng(42);
  const pageMat = std(0xf1e8d2, 0.9);
  const fillerCols = [0x7d2f35, 0x2d4a77, 0x2f6b55, 0x8a6b2c, 0x5c3a76, 0x3a3f4a, 0x9a5a2a, 0x1f5b66];
  const fillerMats = fillerCols.map((c) => std(c, 0.65));

  const innerL = -W / 2 + 0.07, innerR = W / 2 - 0.07;
  const books = new Map();

  const filler = (x, boardTop, thick) => {
    const bh = 0.26 + rnd() * 0.09;
    const mat = fillerMats[Math.floor(rnd() * fillerMats.length)];
    const m = add(new THREE.BoxGeometry(thick, bh, 0.24 + rnd() * 0.04), mat, x, boardTop + bh / 2, -0.02);
    m.rotation.z = rnd() < 0.05 ? (rnd() - 0.5) * 0.25 : 0;
  };

  // two shelves host the project books; all shelves get filler books
  const hostRows = [1, 2]; // indexes into BOARDS
  const perRow = Math.ceil(projectItems.length / hostRows.length) || 1;
  let itemIndex = 0;
  BOARDS.forEach((boardTop, row) => {
    let x = innerL + 0.02;
    const isHost = hostRows.includes(row) && itemIndex < projectItems.length;
    if (!isHost) {
      // a tidy run of filler books, with a gap for variety on the top row
      const stop = row === BOARDS.length - 1 ? innerL + 0.7 : innerR - 0.02;
      while (x < stop - 0.06) {
        const t = 0.045 + rnd() * 0.05;
        filler(x + t / 2, boardTop, t);
        x += t + 0.004;
      }
      return;
    }
    const groupW = (innerR - innerL - 0.04) / perRow;
    for (let g = 0; g < perRow; g++) {
      const gx0 = innerL + 0.02 + g * groupW;
      const item = projectItems[itemIndex];
      const thick = 0.1;
      const bookH = 0.33 + (hash01(item ? item.id : "x") * 0.03);
      const cx = gx0 + groupW / 2;
      // fillers left of the project book
      let fx = gx0;
      while (fx < cx - thick / 2 - 0.05) {
        const t = 0.045 + rnd() * 0.04;
        filler(fx + t / 2, boardTop, t);
        fx += t + 0.004;
      }
      if (item) {
        const spine = toTexture(spineCanvas(item));
        const cover = std(0x20242d, 0.6);
        const mats = [cover, cover, pageMat, pageMat, new THREE.MeshStandardMaterial({ map: spine, roughness: 0.55 }), pageMat];
        const book = new THREE.Mesh(new THREE.BoxGeometry(thick, bookH, 0.27), mats);
        book.position.set(cx, boardTop + bookH / 2, 0.0);
        book.castShadow = true;
        book.receiveShadow = true;
        group.add(book);
        makeInteractive(book, { type: "book", id: item.id, label: item.title, restZ: book.position.z });
        books.set(item.id, book);
        onBookMesh && onBookMesh(item.id, book);
        itemIndex++;
      }
      // fillers right of the project book
      let rx = cx + thick / 2 + 0.006;
      const rEnd = gx0 + groupW;
      while (rx < rEnd - 0.05) {
        const t = 0.045 + rnd() * 0.04;
        filler(rx + t / 2, boardTop, t);
        rx += t + 0.004;
      }
    }
  });

  // little decorations: a small plant-like sphere cluster and a stack on top row
  const globeBase = add(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 20), std(0xb99a4a, 0.3, 0.8), innerR - 0.2, BOARDS[4] + 0.01, 0.02);
  add(new THREE.SphereGeometry(0.11, 24, 18), new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.35, metalness: 0.1 }), innerR - 0.2, BOARDS[4] + 0.17, 0.02);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.006, 8, 32, Math.PI * 1.1), std(0xb99a4a, 0.3, 0.8));
  ring.position.set(innerR - 0.2, BOARDS[4] + 0.17, 0.02);
  ring.rotation.set(0.2, 0.4, 0.4);
  group.add(ring);

  return { group, books };
}

function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Slide a book out of (or back into) the shelf. */
export function pullOutBook(book, out = true) {
  const rest = book.userData.restZ ?? 0;
  tweens.to(book.position, { z: out ? rest + BOOK_PULL : rest }, 450, {
    key: "pull-" + book.userData.id,
    ease: ease.outCubic,
  });
}
