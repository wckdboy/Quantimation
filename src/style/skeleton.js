// A proportion skeleton in the set camera. Depth and the floor line come from
// the same placement the episode uses, so a control image cannot invent scale.

import { MODELS, groundPlacement } from "../drawn.js";

const JOINTS = ["crown", "chin", "shoulderL", "shoulderR", "hipL", "hipR", "kneeL", "kneeR", "footL", "footR"];

function heights(heads) {
  const chin = 1 / heads;
  return {
    crown: 0,
    chin,
    shoulder: chin + 0.22 / heads,
    hip: 0.58,
    knee: 0.78,
    foot: 1,
  };
}

export function poseSkeleton({ character = "dot", view = "front", depth = 0.2, groundX = 640, scene = {} } = {}) {
  const model = MODELS[character];
  if (!model) throw new Error(`Unknown character ${character}.`);
  const place = groundPlacement(scene, { depth, groundX });
  const y = heights(model.heads);
  const reach = view === "profile" ? 0.08 : 0.16;
  const sign = view === "profile" ? 1 : 1;
  const side = (which) => (view === "profile" ? (which === "L" ? -0.02 : 0.04) : which === "L" ? -reach : reach) * sign;
  const point = (name, nx, ny) => ({
    name,
    x: place.x + nx * model.world * 0.5 * place.scale,
    y: place.y - (1 - ny) * model.world * place.scale,
  });
  const joints = [
    point("crown", 0, y.crown),
    point("chin", side("R") * 0.2, y.chin),
    point("shoulderL", side("L"), y.shoulder),
    point("shoulderR", side("R"), y.shoulder),
    point("hipL", side("L") * 0.55, y.hip),
    point("hipR", side("R") * 0.55, y.hip),
    point("kneeL", side("L") * 0.7, y.knee),
    point("kneeR", side("R") * 0.7, y.knee),
    point("footL", side("L") * 0.8, y.foot),
    point("footR", side("R") * 0.8, y.foot),
  ];
  return {
    character,
    view,
    joints,
    order: JOINTS,
    floorY: place.y,
    scale: place.scale,
    horizon: place.horizon,
  };
}
