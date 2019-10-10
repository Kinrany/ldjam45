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

      if (action) {
        game.applyRobotAction(action)(this);
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
      this.robotActions = [...this.robotActions, ["interact", [x, y]]];
    },
    getRobot() {
      return game.getRobot(this);
    }
  }
};
</script>
