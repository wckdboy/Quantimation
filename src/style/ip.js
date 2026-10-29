// Names that must never enter a prompt, a negative, a caption, or a training file.
// Matching is on words, so "proportional" is not "portal".

const BLOCKED = [
  "rick",
  "morty",
  "meeseeks",
  "schwifty",
  "squanch",
  "birdperson",
  "citadel",
  "portal",
  "pickle rick",
  "quark",
  "oona",
];

const WORD = new RegExp(`\\b(${BLOCKED.map((word) => word.replace(/ /g, "\\s+")).join("|")})\\b`, "i");

export function ipViolation(text) {
  const found = String(text || "").match(WORD);
  return found ? found[1].toLowerCase() : "";
}

export function assertIpSafe(text, label = "Prompt") {
  const hit = ipViolation(text);
  if (hit) throw new Error(`${label} blocked a protected name (${hit}).`);
  return text;
}
