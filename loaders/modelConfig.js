// ---------------------------------------------------------------------------
// modelConfig.js — OPTIONAL extra 3D models (.glb) to place in the room.
//
// The office is fully procedural, so you do NOT need any models. If you
// want to add your own (a poster tube, a globe, a certificate holder…):
//   1. put the .glb in assets/models/  (Draco-compressed files are supported)
//   2. add an entry below and set  enabled: true
// Positions are in metres: x = left/right, y = up, z = toward the camera.
// Room bounds: x ∈ [-5, 5], z ∈ [-4.5, 4.5], height 3.2.
// ---------------------------------------------------------------------------
export const EXTRA_MODELS = [
  {
    id: "example",
    enabled: false,                       // ← set to true once the file exists
    url: "assets/models/example.glb",
    position: [0, 0, 1.5],
    rotation: [0, 0, 0],                  // radians
    scale: 1,
  },
];
