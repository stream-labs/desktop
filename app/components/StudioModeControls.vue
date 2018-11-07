<template>
<div class="studio-mode-controls" :class="{ stacked }">
  <span class="studio-mode-control">
    Edit
  </span>
  <button
    class="button button--default"
    @click="studioModeTransition">
    Transition
    <i class="fa fa-arrow-down" v-if="stacked" />
    <i class="fa fa-arrow-right" v-else />
  </button>
  <span class="studio-mode-control">
    Live
  </span>
</div>
</template>

<script lang="ts" src="./StudioModeControls.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.studio-mode-controls {
  height: 60px;
  display: flex;
  align-items: center;
  color: @night-paragraph;
  background-color: @navy-secondary;

  &.stacked {
    flex-direction: column;
    padding: 0 10px;
    height: initial;
  }
}

.studio-mode-control {
  flex-grow: 1;
  text-align: center;
  font-size: 16px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
