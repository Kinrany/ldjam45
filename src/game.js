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

const robotActions = {
  interact: pos => state => {
    const robot = getRobot(state);
    let items = state.items;

    const itemsAtPos = ItemStore.filter(state.items, isAt(pos));
    for (const item of itemsAtPos) {
      if (item.imageName === "dead") {
        items = ItemStore.set(items, item.id, butcher(item));
        break;
      }
      if (item.imageName === "battery") {
        items = ItemStore.remove(items, item.id);
        items = ItemStore.set(
          items,
          robot.id,
          charged(robot, item.energy)
        );
        break;
      }
    }
    return [{ ...state, items }];
  },
  move: direction => state => {
    const robot = getRobot(state);
    let items = state.items;

    if (robot.energy > 0) {
      const [dx, dy] = DIRECTIONS[direction];
      items = ItemStore.set(
        items,
        robot.id,
        moved(robot, [dx, dy])
      );
    }
    return [{ ...state, items }];
  },
  respawn: () => state => {
    const robot = getRobot(state);
    let items = state.items;

    // replace old robot with a dead body
    items = ItemStore.set(
      items,
      robot.id,
      dead(robot)
    );

    // add a new robot at the spawn point
    const spawn = ItemStore.find(
      items,
      item => item.imageName === "spawn"
    );
    items = ItemStore.add(items, Robot(spawn.pos));

    state = { ...state, items };

    // replace dead body with a glitch after some time
    const spawnGlitchAction = ["setTimeout", 3000, "spawnGlitch", robot.id];

    return [state, spawnGlitchAction];
  }
};

const applyRobotAction = (actionName, ...args) => state => {
  return getRobot(state)
    ? robotActions[actionName](...args)(state)
    : state;
};

const gameActions = {
  robotAction: applyRobotAction,
  cameraAction: applyCameraAction,
  spawnGlitch: (deadId) => state => {
    let items = state.items;

    // find the body
    const deadItem = ItemStore.find(
      items,
      item => item.id === deadId && item.imageName === "dead"
    );

    // if the body is still there, replace with a glitch
    if (deadItem) {
      items = ItemStore.set(
        items,
        deadItem.id,
        { ...deadItem, imageName: "glitch" }
      );
    }

    return [{ ...state, items }];
  }
};

export const applyGameAction = (actionName, ...args) => state => {
  return gameActions[actionName](...args)(state);
};
