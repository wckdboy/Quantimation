// Drawing library. Authored keys live here. authorDrawing lets a director add
// or replace a key with smooth cubic contours.

import { morphDrawings } from "./curves.js";
import { TEO_SHEET } from "./drawings/teo.js";

const sheets = new Map();
const overrides = new Map();

function keyOf(character, view, pose) {
  return `${character}/${view}/${pose || "stand"}`;
}

function store(map, character, view, pose, drawing) {
  if (!drawing?.shapes?.length) throw new Error("A key drawing needs contours.");
  for (const shape of drawing.shapes) {
    if (typeof shape.path !== "string" || !/[CcQq]/.test(shape.path))
      throw new Error(`Contour ${shape.id || ""} must be a smooth Bézier.`);
    if (shape.type === "polygon" || shape.type === "ellipse" || shape.type === "rect")
      throw new Error("Key drawings cannot use polygon primitives.");
  }
  map.set(keyOf(character, view, pose), drawing);
}

for (const drawing of TEO_SHEET) store(sheets, "teo", drawing.view, drawing.pose, drawing);

export function authorDrawing({ character, view, pose = "stand", shapes, feet, crown, chin, width, height }) {
  const drawing = {
    character,
    view,
    pose,
    width: width || 520,
    height: height || 860,
    feet: feet || [[200, 820], [320, 820]],
    crown: crown ?? 40,
    chin: chin ?? 200,
    shapes,
  };
  store(overrides, character, view, pose, drawing);
  return { character, view, pose, contours: shapes.length };
}

export function libraryDrawing(character, view, pose = "stand") {
  return overrides.get(keyOf(character, view, pose)) || sheets.get(keyOf(character, view, pose)) || null;
}

export function posedDrawing(character, view, poseName, poseTo, u = 0) {
  const from = libraryDrawing(character, view, poseName) || libraryDrawing(character, view, "stand");
  if (!from) return null;
  const toName = poseTo && poseTo !== poseName ? poseTo : poseName;
  const to = libraryDrawing(character, view, toName) || from;
  if (to === from || u < 0.001) return from;
  return morphDrawings(from, to, Math.max(0, Math.min(1, u)));
}

export function sheetPoses(character) {
  const names = [];
  for (const map of [sheets, overrides]) {
    for (const key of map.keys()) {
      if (key.startsWith(`${character}/`)) names.push(key);
    }
  }
  return names;
}
