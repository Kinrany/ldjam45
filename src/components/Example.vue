<template>
  <div>
    <vue-p5
      @preload="preload"
      @setup="setup"
      @draw="draw"
      @keypressed="keyPressed"
      @mousemoved="mouseMoved"
      @mousedragged="mouseDragged"
    ></vue-p5>
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

export default {
  name: "ldjam45-game",
  components: {
    "vue-p5": VueP5
  },
  data: () => ({
    items: [
      { pos: [2, 2], imageName: "spawn" },
      { pos: [3, 2], imageName: "robot" }
    ],
    robotActions: [],
    zoom: 0,
    cameraOffset: [0, 0]
  }),
  computed: {
    robotId() {
      return this.items.findIndex(item => item.imageName === "robot");
    },
    robot() {
      return this.robotId === -1 ? undefined : this.items[this.robotId];
    },
    // width and height of a tile in screen pixels
    tileOnScreen() {
      return TILE * Math.pow(2, this.zoom);
    },
    // number of tiles that fit on screen at once
    tilesOnScreen() {
      return Math.ceil(CANVAS / this.tileOnScreen);
    }
  },
  methods: {
    preload(sketch) {
      const imageNames = ["robot", "sand", "dead", "spawn"];
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
          if (!this.robot) break;
          this.setItem(this.robotId, { ...this.robot, imageName: "dead" });
          const spawn = this.items.find(item => item.imageName === "spawn");
          this.addItem({ pos: spawn.pos, imageName: "robot" });
          break;

        case "move":
          const [x, y] = this.robot.pos;
          const [direction] = actionData;
          const [dx, dy] = DIRECTIONS[direction];
          this.setItem(this.robotId, { ...this.robot, pos: [x + dx, y + dy] });
          break;
      }
    },
    draw(sketch) {
      this.update();

      sketch.background(0, 0, 0);

      // background tiles
      range(0, this.tilesOnScreen).forEach(x => {
        range(0, this.tilesOnScreen).forEach(y => {
          sketch.image(
            images.get("sand"),
            x * this.tileOnScreen,
            y * this.tileOnScreen,
            this.tileOnScreen,
            this.tileOnScreen
          );
        });
      });

      // items
      const items = this.items.filter(item => {
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        return (
          inRange(cx, x, cx + this.tilesOnScreen) &&
          inRange(cy, y, cy + this.tilesOnScreen)
        );
      });
      items.forEach(item => {
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        sketch.image(
          images.get(item.imageName),
          (x - cx) * this.tileOnScreen,
          (y - cy) * this.tileOnScreen,
          this.tileOnScreen,
          this.tileOnScreen
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
          this.robotActions = [...this.robotActions, ["move", direction]];
          break;
        }
        case KEYCODES.r:
          this.robotActions = [...this.robotActions, ["respawn"]];
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
    mouseMoved({ mouseX, mouseY, pmouseX, pmouseY }) {},
    mouseDragged({ mouseX, mouseY, pmouseX, pmouseY }) {},
    addItem(item) {
      this.items = [...this.items, item];
    },
    setItem(itemId, item) {
      if (!this.items[itemId]) {
        throw new Error(`Item id ${itemId} does not exist`);
      }
      this.items = [
        ...this.items.slice(0, itemId),
        item,
        ...this.items.slice(itemId + 1)
      ];
    }
  }
};
</script>
