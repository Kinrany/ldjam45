export const images = new Map();

export const names = ["robot", "sand", "dead", "spawn", "battery"];

export function preload(sketch) {
  for (const name of names) {
    images.set(name, sketch.loadImage(`static/${name}.png`));
  }
}
