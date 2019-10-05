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
  </div>
</template>

<script>
import VueP5 from "vue-p5";

// width and height of a tile in pixels
const TILE = 64;
// tiles on screen, horizontally and vertically
const SCREEN = 8;

const KEYCODES = {
  a: 65,
  d: 68,
  r: 82,
  s: 83,
  w: 87
};

export default {
  name: "p5-example",
  components: {
    "vue-p5": VueP5
  },
  data: () => ({
    images: {},
    items: [{ pos: [0, 0], imageName: "robot" }],
    robotActions: []
  }),
  computed: {
    robotId() {
      return this.items.findIndex(
        ({ pos, imageName }) => imageName === "robot"
      );
    },
    robot() {
      return this.robotId === -1 ? undefined : this.items[this.robotId];
    }
  },
  methods: {
    preload(sketch) {
      const imageNames = ["robot", "sand", "dead"];
      for (const name of imageNames) {
        this.images[name] = sketch.loadImage(`static/${name}.png`);
      }
    },
    setup(sketch) {
      sketch.createCanvas(TILE * SCREEN, TILE * SCREEN);
    },
    update(sketch) {
      if (!this.robot) {
        this.robotActions = [];
        return;
      }

      const [action, ...tail] = this.robotActions;
      this.robotActions = tail;

      if (!action) return;

      const [name, ...actionData] = action;
      switch (name) {
        case "respawn":
          if (!this.robot) break;
          this.setRobot({ ...this.robot, imageName: "dead" });
          break;

        case "move":
          const [direction] = actionData;
          let {
            pos: [x, y]
          } = this.robot;

          switch (direction) {
            case "up":
              y -= 1;
              break;
            case "down":
              y += 1;
              break;
            case "left":
              x -= 1;
              break;
            case "right":
              x += 1;
              break;
          }

          // clamp position to prevent the robot from leaving the screen
          x = Math.max(0, Math.min(x, SCREEN));
          y = Math.max(0, Math.min(y, SCREEN));

          this.setRobot({ ...this.robot, pos: [x, y] });
          break;
      }
    },
    draw(sketch) {
      this.update();

      sketch.background(0, 0, 0);

      for (let x = 0; x < SCREEN; ++x) {
        for (let y = 0; y < SCREEN; ++y) {
          sketch.image(this.images.sand, x * TILE, y * TILE, TILE, TILE);
        }
      }

      for (let i = 0; i < this.items.length; ++i) {
        const {
          pos: [x, y],
          imageName
        } = this.items[i];
        sketch.image(this.images[imageName], x * TILE, y * TILE, TILE, TILE);
      }
    },
    keyPressed({ keyCode }) {
      switch (keyCode) {
        case KEYCODES.a:
          this.robotActions = [...this.robotActions, ["move", "left"]];
          break;
        case KEYCODES.d:
          this.robotActions = [...this.robotActions, ["move", "right"]];
          break;
        case KEYCODES.s:
          this.robotActions = [...this.robotActions, ["move", "down"]];
          break;
        case KEYCODES.w:
          this.robotActions = [...this.robotActions, ["move", "up"]];
          break;
        case KEYCODES.r:
          this.robotActions = [...this.robotActions, ["respawn"]];
          break;
      }
    },
    mouseMoved({ mouseX, mouseY, pmouseX, pmouseY }) {},
    mouseDragged({ mouseX, mouseY, pmouseX, pmouseY }) {},
    setRobot(item) {
      this.items = [
        ...this.items.slice(0, this.robotId),
        item,
        ...this.items.slice(this.robotId + 1)
      ];
    }
  }
};
</script>
