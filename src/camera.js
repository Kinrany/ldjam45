import { range, inRange } from "./util";
import * as Images from "./images";
import * as ItemStore from "./item-store";

// width and height of a tile .png file
export const TILE = 64;
// width and height of the canvas in window pixels
export const CANVAS = TILE * 8;

export const DIRECTIONS = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1]
};

export const create = () => ({
  zoom: 0,
  offset: [0, 0]
});

export const getTileSizeOnCanvas = camera => TILE * Math.pow(2, camera.zoom);
export const getTileCountOnCanvas = camera => Math.ceil(CANVAS / getTileSizeOnCanvas(camera));

const cameraActions = {
  move: direction => state => {
    const [x, y] = state.camera.offset;
    const [dx, dy] = DIRECTIONS[direction];
    state.camera.offset = [x + dx, y + dy];
  },
  zoom: inOrOut => state => {
    if (inOrOut === "in") {
      state.camera.zoom += 1;
    }
    else if (inOrOut === "out") {
      state.camera.zoom -= 1;
    }
  }
}

export const applyCameraAction = (actionName, ...args) => state => {
  cameraActions[actionName](...args)(state);
};

export function draw(sketch, state) {
  const camera = state.camera;

  sketch.background(0, 0, 0);

  // background tiles
  range(0, getTileCountOnCanvas(camera)).forEach(x => {
    range(0, getTileCountOnCanvas(camera)).forEach(y => {
      sketch.image(
        Images.images.get("sand"),
        x * getTileSizeOnCanvas(camera),
        y * getTileSizeOnCanvas(camera),
        getTileSizeOnCanvas(camera),
        getTileSizeOnCanvas(camera)
      );
    });
  });

  // items
  ItemStore.filter(state.items, item => {
    const [x, y] = item.pos;
    const [cx, cy] = camera.offset;
    return (
      inRange(cx, x, cx + getTileCountOnCanvas(camera)) &&
      inRange(cy, y, cy + getTileCountOnCanvas(camera))
    );
  }).forEach(item => {
    const [x, y] = item.pos;
    const [cx, cy] = camera.offset;
    sketch.image(
      Images.images.get(item.imageName),
      (x - cx) * getTileSizeOnCanvas(camera),
      (y - cy) * getTileSizeOnCanvas(camera),
      getTileSizeOnCanvas(camera),
      getTileSizeOnCanvas(camera)
    );
  });
}

export function canvasToTile(camera, [canvasX, canvasY]) {
  if (!inRange(0, canvasX, CANVAS) || !inRange(0, canvasY, CANVAS)) {
    return;
  }

  const [cx, cy] = camera.offset;
  const x = Math.floor(canvasX / getTileSizeOnCanvas(camera)) + cx;
  const y = Math.floor(canvasY / getTileSizeOnCanvas(camera)) + cy;
  return [x, y];
}
