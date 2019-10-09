<template>
  <div>
    <vue-p5
      @preload="preload"
      @setup="setup"
      @draw="draw"
      @keypressed="keyPressed"
      @mouseclicked="mouseClicked"
    ></vue-p5>
    <div>Energy: {{robot ? robot.energy : 0}}</div>
    <div>
      Zoom:
      <button @click="zoom += 1">+</button>
      <button @click="zoom -= 1">-</button>
    </div>
  </div>
</template>

<script>
import VueP5 from "vue-p5";

// width and height of a tile .png file
const TILE = 64;
// width and height of the canvas in window pixels
const CANVAS = TILE * 8;

const KEYCODES = {
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

const DIRECTIONS = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1]
};

const images = new Map();

const range = (a, b) =>
  Array(b - a)
    .fill(0)
    .map((_, i) => a + i);
const inRange = (a, x, b) => a <= x && x < b;
const clamp = (a, x, b) => Math.max(a, Math.min(x, b));

const robot = pos => ({ pos, imageName: "robot", energy: 10 });
const spawn = pos => ({ pos, imageName: "spawn" });

const dead = robot => ({ ...robot, imageName: "dead" });
const moved = (robot, [dx, dy]) => {
  const [x, y] = robot.pos;
  const energy = robot.energy - 1;
  return { ...robot, energy, pos: [x + dx, y + dy] };
};
const charged = (robot, energy) => ({
  ...robot,
  energy: robot.energy + energy
});

const butcher = dead => ({ ...dead, imageName: "battery" });

export default {
  name: "vue-app",
  components: {
    "vue-p5": VueP5
  },
  data: () => ({
    items: [{ id: 0, ...spawn([2, 2]) }, { id: 1, ...robot([3, 2]) }],
    robotActions: [],
    zoom: 0,
    cameraOffset: [0, 0]
  }),
  computed: {
    robotId() {
      return this.items.findIndex(item => item && item.imageName === "robot");
    },
    robot() {
      return this.items.find(item => item && item.imageName === "robot");
    },
    // width and height of a tile in canvas pixels
    tileOnCanvas() {
      return TILE * Math.pow(2, this.zoom);
    },
    // number of tiles that fit on canvas at once
    tilesOnCanvas() {
      return Math.ceil(CANVAS / this.tileOnCanvas);
    }
  },
  methods: {
    preload(sketch) {
      const imageNames = ["robot", "sand", "dead", "spawn", "battery"];
      for (const name of imageNames) {
        images.set(name, sketch.loadImage(`static/${name}.png`));
      }
    },
    setup(sketch) {
      sketch.createCanvas(CANVAS, CANVAS);
    },
    update(sketch) {
      if (!this.robot) {
        if (this.robotActions.length > 0) {
          // prevent unnecessary updates
          this.robotActions = [];
        }
        return;
      }

      const [action, ...tail] = this.robotActions;
      this.robotActions = tail;

      if (!action) return;

      const [name, ...actionData] = action;
      switch (name) {
        case "respawn":
          this.setItem(this.robotId, dead(this.robot));
          const spawn = this.items.find(
            item => item && item.imageName === "spawn"
          );
          this.addItem(robot(spawn.pos));
          break;

        case "move":
          const [direction] = actionData;
          if (this.robot.energy > 0) {
            const [x, y] = this.robot.pos;
            const [dx, dy] = DIRECTIONS[direction];
            this.setItem(this.robotId, moved(this.robot, [dx, dy]));
          }
          break;

        case "interact":
          const [pos] = actionData;
          const items = this.itemsAt(pos);
          for (const item of items) {
            if (item.imageName === "dead") {
              this.setItem(item.id, butcher(item));
              break;
            }
            if (item.imageName === "battery") {
              const battery = this.removeItem(item.id);
              this.setItem(this.robotId, charged(this.robot, battery.energy));
              break;
            }
          }
      }
    },
    draw(sketch) {
      this.update();

      sketch.background(0, 0, 0);

      // background tiles
      range(0, this.tilesOnCanvas).forEach(x => {
        range(0, this.tilesOnCanvas).forEach(y => {
          sketch.image(
            images.get("sand"),
            x * this.tileOnCanvas,
            y * this.tileOnCanvas,
            this.tileOnCanvas,
            this.tileOnCanvas
          );
        });
      });

      // items
      const items = this.items.filter(item => {
        if (!item) return false;
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        return (
          inRange(cx, x, cx + this.tilesOnCanvas) &&
          inRange(cy, y, cy + this.tilesOnCanvas)
        );
      });
      items.forEach(item => {
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        sketch.image(
          images.get(item.imageName),
          (x - cx) * this.tileOnCanvas,
          (y - cy) * this.tileOnCanvas,
          this.tileOnCanvas,
          this.tileOnCanvas
        );
      });
    },
    keyPressed({ keyCode }) {
      switch (keyCode) {
        case KEYCODES.a:
        case KEYCODES.d:
        case KEYCODES.s:
        case KEYCODES.w: {
          const direction = {
            [KEYCODES.a]: "left",
            [KEYCODES.d]: "right",
            [KEYCODES.s]: "down",
            [KEYCODES.w]: "up"
          }[keyCode];
          this.addRobotAction(["move", direction]);
          break;
        }
        case KEYCODES.r:
          this.addRobotAction(["respawn"]);
          break;
        case KEYCODES.arrowDown:
        case KEYCODES.arrowLeft:
        case KEYCODES.arrowRight:
        case KEYCODES.arrowUp: {
          const direction = {
            [KEYCODES.arrowDown]: "down",
            [KEYCODES.arrowLeft]: "left",
            [KEYCODES.arrowRight]: "right",
            [KEYCODES.arrowUp]: "up"
          }[keyCode];
          const [x, y] = this.cameraOffset;
          const [dx, dy] = DIRECTIONS[direction];
          this.cameraOffset = [x + dx, y + dy];
          break;
        }
      }
    },
    mouseClicked({ mouseX, mouseY }) {
      if (!inRange(0, mouseX, CANVAS) || !inRange(0, mouseY, CANVAS)) {
        return;
      }
      if (!robot) {
        return;
      }

      const [cx, cy] = this.cameraOffset;
      const x = Math.floor(mouseX / this.tileOnCanvas) + cx;
      const y = Math.floor(mouseY / this.tileOnCanvas) + cy;
      this.addRobotAction(["interact", [x, y]]);
    },
    addItem(item) {
      const id = this.items.length;
      this.items = [...this.items, { ...item, id }];
    },
    setItem(itemId, item) {
      if (!this.items[itemId]) {
        throw new Error(`Item id ${itemId} does not exist`);
      }
      this.items.splice(itemId, 1, item);
      this.items = this.items;
    },
    removeItem(itemId) {
      const item = this.items[itemId];
      this.items[itemId] = undefined;
      return item;
    },
    itemsAt(pos) {
      const [x, y] = pos;
      return this.items.filter(item => {
        if (!item) return false;
        const [itemX, itemY] = item.pos;
        return x === itemX && y === itemY;
      });
    },
    addRobotAction(action) {
      this.robotActions = [...this.robotActions, action];
    }
  }
};
</script>
