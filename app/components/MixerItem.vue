<template>
<div
  class="mixer-item"
  :class="{ muted: audioSource.muted }"
  :data-test-source-name="audioSource.source.name"
  :data-test-source-type="audioSource.source.type"
>

  <div class="title-container">
    <div class="source-name">{{ audioSource.source.name }}</div>
    <div class="db-value">
      <div v-if="audioSource.fader.deflection == 0">-Inf dB</div>
      <div v-if="audioSource.fader.deflection !== 0">{{ audioSource.fader.db.toFixed(1) }} dB</div>
    </div>
  </div>

  <MixerVolmeter :audioSource="audioSource" v-if="previewEnabled"></MixerVolmeter>

  <div class="flex">
    <Slider
      :value="audioSource.fader.deflection"
      :min="0"
      :max="1"
      :interval="0.01"
      @input="onSliderChangeHandler"
      tooltip="false"
    />
    <div class="controls">
      <i class="icon-btn icon-speaker"
         title="click to switch off"
         v-if="!audioSource.muted"
         @click="setMuted(true)"
      >
      </i>
      <i
        class="icon-btn icon-mute"
        title="click to switch on"
        v-if="audioSource.muted"
        @click="setMuted(false)"
      >
      </i>
      <i
        class="icon-btn icon-settings"
        @click="showSourceMenu(audioSource.sourceId)"
        v-if="!compactMode"
      >
      </i>
    </div>
  </div>

</div>
</template>

<script lang="ts" src="./MixerItem.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.mixer-item {
  position: relative;
  padding: 8px 12px 0;
  color: var(--color-text);

  .source-name {
    flex: 1;
    font-size: @font-size2;
  }

  .db-value {
    font-size: @font-size2;
    width: 60px;
    text-align: right;
  }

  .slider {
    flex: 1;
  }

  &.muted .slider {
    opacity: 0.4;
  }

  &.muted .icon-mute {
    color: var(--color-text-dark);
    opacity: 1;

    &:hover {
      color: var(--color-text-light);
    }
  }

  .controls {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }
}

</style>
