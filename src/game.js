import { TILE, CANVAS, KEYCODES, DIRECTIONS } from "./consts";

export const Robot = pos => ({ pos, imageName: "robot", energy: 10 });
export const Spawn = pos => ({ pos, imageName: "spawn" });

export const dead = robot => ({ ...robot, imageName: "dead" });
export const moved = (robot, [dx, dy]) => {
  const [x, y] = robot.pos;
  const energy = robot.energy - 1;
  return { ...robot, energy, pos: [x + dx, y + dy] };
};
export const charged = (robot, energy) => ({
  ...robot,
  energy: robot.energy + energy
});

export const butcher = dead => ({ ...dead, imageName: "battery" });

export const getRobot = state => state.items.find(item => item && item.imageName === "robot");
export const getTileSizeOnCanvas = state => TILE * Math.pow(2, state.zoom);
export const getTileCountOnCanvas = state => Math.ceil(CANVAS / getTileSizeOnCanvas(state));
