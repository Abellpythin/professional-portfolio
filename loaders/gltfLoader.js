// ---------------------------------------------------------------------------
// gltfLoader.js — GLTF + Draco loader with per-model progress.
// Everything (including the Draco decoder) is served from vendor/, so no
// internet connection is needed. A model that fails to load never breaks the
// scene: its promise resolves to `null`.
// ---------------------------------------------------------------------------
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

let gltfLoader = null;
function getLoader() {
  if (gltfLoader) return gltfLoader;
  const draco = new DRACOLoader();
  draco.setDecoderPath("vendor/three/addons/libs/draco/gltf/");
  gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  return gltfLoader;
}

export function loadModel(url, onProgress = () => {}) {
  return new Promise((resolve) => {
    getLoader().load(
      url,
      (gltf) => { onProgress(1); resolve(gltf.scene); },
      (xhr) => { if (xhr.total) onProgress(xhr.loaded / xhr.total); },
      (err) => {
        console.warn(`[gltfLoader] could not load "${url}": ${err?.message || err}`);
        onProgress(1);
        resolve(null);
      }
    );
  });
}

/** Load several models; reports the average progress (0..1) as it goes. */
export async function loadModels(entries, onOverallProgress = () => {}) {
  const results = {};
  if (!entries.length) return results;
  const per = new Array(entries.length).fill(0);
  await Promise.all(entries.map(async (entry, i) => {
    results[entry.id] = await loadModel(entry.url, (f) => {
      per[i] = f;
      onOverallProgress(per.reduce((a, b) => a + b, 0) / entries.length);
    });
  }));
  return results;
}
