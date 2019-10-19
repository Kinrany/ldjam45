<template>
  <div>
    <vue-p5
      @preload="preload"
      @setup="setup"
      @draw="draw"
      @keypressed="keyPressed"
      @mouseclicked="mouseClicked"
    ></vue-p5>
    <game-ui
      :robot="getRobot(this)"
      @zoom-increment="applyGameAction('cameraAction', 'zoom', 'in')"
      @zoom-decrement="applyGameAction('cameraAction', 'zoom', 'out')"
    ></game-ui>
  </div>
</template>

<script>
import VueP5 from "vue-p5";
import Ui from "./Ui.vue";
import * as Game from "./game";
import * as Camera from "./camera";
import * as ItemStore from "./item-store";
import CONTROL_KEYS from "./controls";
import * as Images from "./images";

export default {
  name: "vue-app",
  components: {
    "vue-p5": VueP5,
    "game-ui": Ui
  },
  data: () => ({
    state: {
      items: ItemStore.create([Game.Spawn([2, 2]), Game.Robot([3, 2])]),
      camera: Camera.create()
    }
  }),
  methods: {
    preload(sketch) {
      Images.preload(sketch);
    },
    setup(sketch) {
      sketch.createCanvas(Camera.CANVAS, Camera.CANVAS);
    },
    draw(sketch) {
      Camera.draw(sketch, this.state);
    },
    keyPressed({ keyCode }) {
      const action = CONTROL_KEYS.get(keyCode);
      if (action) {
        this.applyGameAction(...action);
      }
    },
    mouseClicked({ mouseX, mouseY }) {
      const pos = Camera.canvasToTile(this.state.camera, [mouseX, mouseY]);
      if (pos) {
        this.applyGameAction("robotAction", "interact", pos);
      }
    },
    getRobot() {
      return Game.getRobot(this.state);
    },
    applyGameAction(...action) {
      const actions = [action];
      while (actions.length > 0) {
        const action = actions.shift();
        if (action[0] === "setTimeout") {
          this.setActionTimeout(action.slice(2), action[1]);
        } else {
          const [state, ...newActions] = Game.applyGameAction(...action)(
            this.state
          );
          actions.push(...newActions);
          this.state = state;
        }
      }
    },
    setActionTimeout(action, timeout) {
      setTimeout(() => {
        this.applyGameAction(...action);
      }, timeout);
    }
  }
};
</script>
