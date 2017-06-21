<template>
<div class="studio-controls row expanded">
  <scene-selector class="studio-controls-panel small-4 columns" />
  <source-selector class="studio-controls-panel small-4 columns" />
  <mixer class="studio-controls-panel small-4 columns" />
</div>
</template>

<script>
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';

export default {
  components: {
    SceneSelector,
    SourceSelector,
    Mixer
  }
};
</script>

<style lang="less" scoped>
@import "../styles/index";
.studio-controls {
  height: 280px;
  width: 100%;
  padding: 20px 15px;
}

.studio-controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 15px;
}
</style>

<style lang="less">
@import "../styles/index";
.studio-controls-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 15px;
  justify-content: space-between;
}
.studio-controls__label {
  margin-bottom: 0;
  .semibold;
}
.studio-controls-selector {
  background: @day-secondary;
  border: 1px solid @day-border;
  .radius;
  flex-grow: 1;
}
</style>
