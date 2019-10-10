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
import * as ItemStore from "./item-store";

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

function draw(sketch, state) {
  sketch.background(0, 0, 0);

  // background tiles
  range(0, game.getTileCountOnCanvas(state)).forEach(x => {
    range(0, game.getTileCountOnCanvas(state)).forEach(y => {
      sketch.image(
        images.get("sand"),
        x * game.getTileSizeOnCanvas(state),
        y * game.getTileSizeOnCanvas(state),
        game.getTileSizeOnCanvas(state),
        game.getTileSizeOnCanvas(state)
      );
    });
  });

  // items
  const items = ItemStore.filter(state.items, item => {
    if (!item) return false;
    const [x, y] = item.pos;
    const [cx, cy] = state.cameraOffset;
    return (
      inRange(cx, x, cx + game.getTileCountOnCanvas(state)) &&
      inRange(cy, y, cy + game.getTileCountOnCanvas(state))
    );
  });
  items.forEach(item => {
    const [x, y] = item.pos;
    const [cx, cy] = state.cameraOffset;
    sketch.image(
      images.get(item.imageName),
      (x - cx) * game.getTileSizeOnCanvas(state),
      (y - cy) * game.getTileSizeOnCanvas(state),
      game.getTileSizeOnCanvas(state),
      game.getTileSizeOnCanvas(state)
    );
  });
}

export default {
  name: "vue-app",
  components: {
    "vue-p5": VueP5,
    "game-ui": Ui
  },
  data: () => ({
    items: ItemStore.create([game.Spawn([2, 2]), game.Robot([3, 2])]),
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
      draw(sketch, this);
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
    setItem(id, item) {
      this.items = ItemStore.set(this.items, id, item);
    },
    removeItem(id) {
      const item = ItemStore.get(this.items, id);
      this.items = ItemStore.set(this.items, id, undefined);
      return item;
    },
    itemsAt(pos) {
      const [x, y] = pos;
      return ItemStore.filter(this.items, item => {
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
      const spawn = ItemStore.find(
        this.items,
        item => item && item.imageName === "spawn"
      );
      this.items = ItemStore.add(this.items, game.Robot(spawn.pos));
    },
    getRobot() {
      return game.getRobot(this);
    }
  }
};
</script>
