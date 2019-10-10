import { TILE, CANVAS, KEYCODES, DIRECTIONS } from "./consts";
import * as ItemStore from "./item-store";

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

export const getRobot = state => ItemStore.find(state.items, item => item.imageName === "robot");
export const getTileSizeOnCanvas = state => TILE * Math.pow(2, state.zoom);
export const getTileCountOnCanvas = state => Math.ceil(CANVAS / getTileSizeOnCanvas(state));

export const isAt = pos => item => (pos[0] === item.pos[0] && pos[1] === item.pos[1]);

// TODO: wrap with immer.js or make immutable
export const robotActions = {
  interact: (pos) => state => {
    const items = ItemStore.filter(state.items, isAt(pos));
    for (const item of items) {
      if (item.imageName === "dead") {
        state.items = ItemStore.set(state.items, item.id, butcher(item));
        break;
      }
      if (item.imageName === "battery") {
        state.items = ItemStore.remove(state.items, item.id);
        state.items = ItemStore.set(
          state.items,
          getRobot(state).id,
          charged(getRobot(state), item.energy)
        );
        break;
      }
    }
  }
};
