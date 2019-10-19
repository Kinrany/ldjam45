import * as ItemStore from "./item-store";
import { applyCameraAction, DIRECTIONS } from "./camera";

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

export const isAt = pos => item => (pos[0] === item.pos[0] && pos[1] === item.pos[1]);

// TODO: wrap with immer.js or make immutable
const robotActions = {
  interact: pos => state => {
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
    return state;
  },
  move: direction => state => {
    if (getRobot(state).energy > 0) {
      const [dx, dy] = DIRECTIONS[direction];
      state.items = ItemStore.set(
        state.items,
        getRobot(state).id,
        moved(getRobot(state), [dx, dy])
      );
    }
    return state;
  },
  respawn: () => state => {
    state.items = ItemStore.set(
      state.items,
      getRobot(state).id,
      dead(getRobot(state))
    );
    const spawn = ItemStore.find(
      state.items,
      item => item.imageName === "spawn"
    );
    state.items = ItemStore.add(state.items, Robot(spawn.pos));
    return state;
  }
};

const applyRobotAction = (actionName, ...args) => state => {
  return getRobot(state)
    ? robotActions[actionName](...args)(state)
    : state;
};

const gameActions = {
  robotAction: applyRobotAction,
  cameraAction: applyCameraAction
};

export const applyGameAction = (actionName, ...args) => state => {
  return gameActions[actionName](...args)(state);
};
