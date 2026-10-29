import { validateAsset } from "./model.js";
import { garagePlate, kitchenLowPlate, kitchenPlate, marketPlate } from "./plates.js";

export const SET_CATALOG = [
  {
    id: "coil_shed",
    name: "Lind Repair",
    kind: "environment",
    description:
      "Teo's garage workshop. Pegboard, a boxy appliance with a pale porthole, and an open door on a lilac street. Original.",
  },
  {
    id: "alien_market",
    name: "The Glasshouse",
    kind: "environment",
    description:
      "A night market under a cracked greenhouse dome. Five stalls recede toward the right, and only the hanging jars are bright.",
  },
  {
    id: "suburb_kitchen",
    name: "Dot's kitchen",
    kind: "environment",
    description:
      "A modest kitchen. Sage cabinets, a window over the sink, a round table, and one teal spiral fruit. Original.",
  },
  {
    id: "suburb_kitchen_low",
    name: "Dot's kitchen, low",
    kind: "environment",
    description:
      "The same kitchen from a low eye height, so the ceiling and cabinet undersides reconverge.",
  },
];

const PLATES = {
  coil_shed: garagePlate,
  alien_market: marketPlate,
  suburb_kitchen: kitchenPlate,
  suburb_kitchen_low: kitchenLowPlate,
};

export function buildSet(standardId, { id = standardId, name, description } = {}) {
  const item = SET_CATALOG.find((entry) => entry.id === standardId);
  const plate = PLATES[standardId];
  if (!item || !plate) return null;
  return validateAsset({
    id,
    name: name || item.name,
    kind: "environment",
    description: description || item.description,
    width: 1280,
    height: 720,
    shapes: plate(),
  });
}
