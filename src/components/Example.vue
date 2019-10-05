<template>
  <div>
    <vue-p5
      @preload="preload"
      @setup="setup"
      @update="update"
      @draw="draw"
      @keypressed="keyPressed"
      @mousemoved="mouseMoved"
      @mousedragged="mouseDragged"
    ></vue-p5>
  </div>
</template>

<script>
import VueP5 from "vue-p5";

const TILE = 64;

export default {
  name: "p5-example",
  components: {
    "vue-p5": VueP5
  },
  data: () => ({
    images: {},
    items: [[0, 0, "robot"]]
  }),
  computed: {},
  methods: {
    preload(sketch) {
      const imageNames = ["robot"];
      for (const name of imageNames) {
        this.images[name] = sketch.loadImage(`static/${name}.png`);
      }
    },
    setup(sketch) {
      sketch.createCanvas(400, 400);
      console.log("bar");
    },
    update(sketch) {},
    draw(sketch) {
      for (const item of this.items) {
        const [x, y, imageName] = item;
        sketch.image(this.images[imageName], x * TILE, y * TILE, TILE, TILE);
      }
    },
    keyPressed({ keyCode }) {},
    mouseMoved({ mouseX, mouseY, pmouseX, pmouseY }) {},
    mouseDragged({ mouseX, mouseY, pmouseX, pmouseY }) {}
  }
};
</script>
