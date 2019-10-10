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
    items: ItemStore.create([Game.Spawn([2, 2]), Game.Robot([3, 2])]),
    camera: Camera.create()
  }),
  methods: {
    preload(sketch) {
      Images.preload(sketch);
    },
    setup(sketch) {
      sketch.createCanvas(Camera.CANVAS, Camera.CANVAS);
    },
    draw(sketch) {
      Camera.draw(sketch, this);
    },
    keyPressed({ keyCode }) {
      this.applyGameAction(...CONTROL_KEYS.get(keyCode));
    },
    mouseClicked({ mouseX, mouseY }) {
      const pos = Camera.canvasToTile(this.camera, [mouseX, mouseY]);
      if (pos) {
        this.applyGameAction("robotAction", "interact", pos);
      }
    },
    getRobot() {
      return Game.getRobot(this);
    },
    applyGameAction(...action) {
      Game.applyGameAction(...action)(this);
    }
  }
};
</script>
