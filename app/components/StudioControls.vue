<template>
<div class="studio-controls row expanded">
  <scene-selector class="studio-controls-panel small-4 columns" />
  <source-selector class="studio-controls-panel small-4 columns" />
  <mixer class="studio-controls-panel small-4 columns" />
</div>
</template>

<script>
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    Mixer
  }
})
export default class StudioControls extends Vue {
}
</script>

<style lang="less" scoped>
@import "../styles/index";

.studio-controls {
  height: 240px;
  width: 100%;
  padding: 16px 15px;
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
  margin-bottom: 10px;
  justify-content: space-between;
  flex: 0 0 20px;
}

.studio-controls__label {
  margin-bottom: 0;
  .semibold;
  color: @grey;
}

.studio-controls-selector {
  background: @day-secondary;
  border: 1px solid @day-border;
  .radius;
  flex-grow: 1;
  overflow-y: auto;
}
</style>
