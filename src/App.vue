<template>
  <div>
    <vue-p5
      @preload="preload"
      @setup="setup"
      @draw="draw"
      @keypressed="keyPressed"
      @mouseclicked="mouseClicked"
    ></vue-p5>
    <game-ui :robot="getRobot(this)" @zoom-increment="zoom += 1" @zoom-decrement="zoom -= 1"></game-ui>
  </div>
</template>

<script>
import VueP5 from "vue-p5";
import Ui from "./Ui.vue";
import { range, inRange, clamp } from "./util";
import * as game from "./game";
import { TILE, CANVAS, KEYCODES, DIRECTIONS } from "./consts";

const images = new Map();

function preload(sketch) {
  const imageNames = ["robot", "sand", "dead", "spawn", "battery"];
  for (const name of imageNames) {
    images.set(name, sketch.loadImage(`static/${name}.png`));
  }
}

function setup(sketch) {
  sketch.createCanvas(CANVAS, CANVAS);
}

export default {
  name: "vue-app",
  components: {
    "vue-p5": VueP5,
    "game-ui": Ui
  },
  data: () => ({
    items: [{ id: 0, ...game.Spawn([2, 2]) }, { id: 1, ...game.Robot([3, 2]) }],
    robotActions: [],
    zoom: 0,
    cameraOffset: [0, 0]
  }),
  methods: {
    preload,
    setup,
    update() {
      if (!game.getRobot(this)) {
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
          this.doRespawn();
          break;

        case "move":
          const [direction] = actionData;
          this.doMove(direction);
          break;

        case "interact":
          const [pos] = actionData;
          this.doInteract(pos);
      }
    },
    draw(sketch) {
      this.update();

      sketch.background(0, 0, 0);

      // background tiles
      range(0, game.getTileCountOnCanvas(this)).forEach(x => {
        range(0, game.getTileCountOnCanvas(this)).forEach(y => {
          sketch.image(
            images.get("sand"),
            x * game.getTileSizeOnCanvas(this),
            y * game.getTileSizeOnCanvas(this),
            game.getTileSizeOnCanvas(this),
            game.getTileSizeOnCanvas(this)
          );
        });
      });

      // items
      const items = this.items.filter(item => {
        if (!item) return false;
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        return (
          inRange(cx, x, cx + game.getTileCountOnCanvas(this)) &&
          inRange(cy, y, cy + game.getTileCountOnCanvas(this))
        );
      });
      items.forEach(item => {
        const [x, y] = item.pos;
        const [cx, cy] = this.cameraOffset;
        sketch.image(
          images.get(item.imageName),
          (x - cx) * game.getTileSizeOnCanvas(this),
          (y - cy) * game.getTileSizeOnCanvas(this),
          game.getTileSizeOnCanvas(this),
          game.getTileSizeOnCanvas(this)
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
      if (!game.getRobot(this)) {
        return;
      }

      const [cx, cy] = this.cameraOffset;
      const x = Math.floor(mouseX / game.getTileSizeOnCanvas(this)) + cx;
      const y = Math.floor(mouseY / game.getTileSizeOnCanvas(this)) + cy;
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
    },
    doInteract(pos) {
      const items = this.itemsAt(pos);
      for (const item of items) {
        if (item.imageName === "dead") {
          this.setItem(item.id, game.butcher(item));
          break;
        }
        if (item.imageName === "battery") {
          const battery = this.removeItem(item.id);
          this.setItem(
            game.getRobot(this).id,
            game.charged(game.getRobot(this), battery.energy)
          );
          break;
        }
      }
    },
    doMove(direction) {
      if (game.getRobot(this).energy > 0) {
        const [x, y] = game.getRobot(this).pos;
        const [dx, dy] = DIRECTIONS[direction];
        this.setItem(
          game.getRobot(this).id,
          game.moved(game.getRobot(this), [dx, dy])
        );
      }
    },
    doRespawn() {
      this.setItem(game.getRobot(this).id, game.dead(game.getRobot(this)));
      const spawn = this.items.find(item => item && item.imageName === "spawn");
      this.addItem(game.Robot(spawn.pos));
    },
    getRobot() {
      return game.getRobot(this);
    }
  }
};
</script>
