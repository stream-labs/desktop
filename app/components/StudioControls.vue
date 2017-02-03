<template>
<div class="studioControls row expanded">
  <theme-selector class="studioControls-panel small-3 columns" />
  <scene-selector class="studioControls-panel small-3 columns" />
  <source-selector class="studioControls-panel small-3 columns" />
  <mixer class="studioControls-panel small-3 columns" />
</div>
</template>

<script>
import ThemeSelector from './ThemeSelector.vue';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';

export default {
  components: {
    ThemeSelector,
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
}

.studioControls-selector {
  border: 1px solid gray;
  flex-grow: 1;
}
</style>
