import { eyeCamera, projectSet } from "./layout.js";

function layer(id, parallax, children) {
  return { type: "group", id, parallax, children };
}

function grouped(setId) {
  const shapes = projectSet(setId, eyeCamera(setId));
  const bins = { far: [], mid: [], floor: [], near: [] };
  for (const shape of shapes) {
    const bin = bins[shape.layer] ? shape.layer : "mid";
    const rest = { ...shape };
    delete rest.layer;
    delete rest.z;
    bins[bin].push(rest);
  }
  return [
    layer("sky_wall", 0.22, bins.far),
    layer("main_set", 0.7, bins.mid),
    layer("floor", 1, bins.floor),
    layer("foreground", 1.12, bins.near),
  ].filter((group) => group.children.length);
}

export function kitchenPlate() {
  return grouped("kitchen");
}

export function garagePlate() {
  return grouped("garage");
}

export function marketPlate() {
  return grouped("market");
}
