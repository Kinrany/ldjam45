export const RAW_CONTROL_KEYS = {
  a: ["robotAction", "move", "left"],
  d: ["robotAction", "move", "right"],
  s: ["robotAction", "move", "down"],
  w: ["robotAction", "move", "up"],

  r: ["robotAction", "respawn"],

  arrowDown: ["moveCamera", "down"],
  arrowLeft: ["moveCamera", "left"],
  arrowRight: ["moveCamera", "right"],
  arrowUp: ["moveCamera", "up"]
};

export const KEYCODES = {
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
  a: 65,
  d: 68,
  r: 82,
  s: 83,
  w: 87
};

export default new Map(
  Object.entries(RAW_CONTROL_KEYS)
    .map(([key, action]) => [KEYCODES[key], action])
);
