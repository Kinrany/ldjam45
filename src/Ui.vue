<template>
  <div>
    <div>Energy: {{robot ? robot.energy : 0}}</div>
    <div>
      Zoom:
      <button @click="$emit('zoom-increment')">+</button>
      <button @click="$emit('zoom-decrement')">-</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ["robot"]
};
</script>
