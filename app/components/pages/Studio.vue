<template>
<div class="studio-page">
  <div class="studio-canvas">
  </div>
  <div class="studio-controls">
    Studio controls go here
  </div>
</div>
</template>

<script>
export default {};
</script>

<style lang="less" scoped>
.studio-page {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.studio-canvas {
  flex-grow: 1;

  background-color: black;
}

.studio-controls {
  height: 200px;
}
</style>
