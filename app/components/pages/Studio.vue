<template>
<div class="studio-page">
  <div class="studio-canvas">
  </div>
  <div class="studio-control-panel row expanded">
    <div class="small-10 columns">
      <div class="row expanded">
        <div class="small-4 columns">
          <scene-selector />
        </div>
        <div class="small-4 columns">
          <source-selector />
        </div>
        <div class="small-4 columns">
          <mixer />
        </div>
      </div>
    </div>
    <div class="small-2 columns">
      <studio-controls />
    </div>
  </div>
</div>
</template>

<script>
import SceneSelector from '../SceneSelector.vue';
import SourceSelector from '../SourceSelector.vue';
import Mixer from '../Mixer.vue';
import StudioControls from '../StudioControls.vue';

export default {
  components: {
    SceneSelector,
    SourceSelector,
    Mixer,
    StudioControls
  }
};
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

.studio-control-panel {
  height: 300px;
  width: 100%;

  padding: 30px 40px;
}

.studio-control-label {
  text-transform: uppercase;
}
</style>

<style lang="less">
.studio-control-label {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 500;
}
</style>

