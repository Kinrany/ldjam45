// width and height of a tile .png file
export const TILE = 64;
// width and height of the canvas in window pixels
export const CANVAS = TILE * 8;

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

export const DIRECTIONS = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1]
};
