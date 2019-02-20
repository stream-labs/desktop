<template>
<div
  class="mixer-item"
  :class="{ muted: audioSource.muted }"
  :data-test-source-name="audioSource.source.name"
  :data-test-source-type="audioSource.source.type"
>

  <div class="flex">
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
      >
      </i>
    </div>
  </div>

</div>
</template>

<script lang="ts" src="./MixerItem.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";

.mixer-item {
  position: relative;
  padding: 4px 8px;
  color: @text-secondary;

  .source-name {
    flex: 1;
  }

  .db-value {
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
    color: @text-active;
    opacity: 1;
  }

  .controls {
    width: 60px;
    text-align: right;
    flex: 0 0 60px;
  }
}

</style>
