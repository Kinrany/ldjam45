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
    zoom: 0,
    cameraOffset: [0, 0]
  }),
  methods: {
    preload,
    setup,
    draw(sketch) {
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
          game.applyGameAction("robotAction", "move", direction)(this);
          break;
        }
        case KEYCODES.r:
          game.applyGameAction("robotAction", "respawn")(this);
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
          game.applyGameAction("moveCamera", direction)(this);
          break;
        }
      }
    },
    mouseClicked({ mouseX, mouseY }) {
      if (!inRange(0, mouseX, CANVAS) || !inRange(0, mouseY, CANVAS)) {
        return;
      }

      const [cx, cy] = this.cameraOffset;
      const x = Math.floor(mouseX / game.getTileSizeOnCanvas(this)) + cx;
      const y = Math.floor(mouseY / game.getTileSizeOnCanvas(this)) + cy;
      game.applyGameAction("robotAction", "interact", [x, y])(this);
    },
    getRobot() {
      return game.getRobot(this);
    }
  }
};
</script>
