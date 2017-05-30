<template>
<div class="studioControls row expanded">
  <scene-selector class="studioControls-panel small-4 columns" />
  <source-selector class="studioControls-panel small-4 columns" />
  <mixer class="studioControls-panel small-4 columns" />
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
}
</script>

<style lang="less" scoped>
.studioControls {
  height: 280px;
  width: 100%;

  padding: 30px 25px;
}

.studioControls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 15px;
}
</style>

<style lang="less">
.studioControls-label {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 500;

  flex-grow: 1;

  margin: 0;
}

.studioControls-top {
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-bottom: 15px;
}

.studioControls-button {
  margin-left: 15px;
  font-size: 16px !important;
  cursor: pointer;
  color: #999;
  opacity: 0.6;

  &:hover {
    opacity: 1.0;
  }
}

.studioControls-selector {
  border: 1px solid gray;
  flex-grow: 1;
}
</style>
