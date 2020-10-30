<template>
<div class="studio-mode-controls" :class="{ stacked }">
  <span class="studio-mode-control">
    {{ $t('common.studioModeButtons.preview') }}
  </span>
  <button
    class="button button--semi-opac"
    @click="studioModeTransition">
    {{ $t('common.studioModeButtons.transition') }}
    <i class="icon-arrow rotate-r90" v-if="stacked" />
    <i class="icon-arrow" v-else />
  </button>
  <span class="studio-mode-control">
    {{ $t('common.studioModeButtons.live') }}
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
  color: @text-primary;
  background-color: @bg-secondary;

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
  font-weight: 700;
  letter-spacing: 0.8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rotate-r90 {
  display: inline-block;
  transform: rotate(90deg);
}
</style>
