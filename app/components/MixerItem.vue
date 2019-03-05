<template>
<div class="mixer-item" :class="{ muted: audioSource.muted}">

  <div class="flex">
    <div class="source-name">{{ audioSource.source.name }}</div>
    <div class="db-value">
      <div v-if="audioSource.fader.deflection === 0">-Inf dB</div>
      <div v-if="audioSource.fader.deflection !== 0">{{ audioSource.fader.db.toFixed(1) }} dB</div>
    </div>
  </div>

  <MixerVolmeter :audioSource="audioSource" v-if="previewEnabled"></MixerVolmeter>

  <div class="flex">
    <slider-input
      :value="audioSource.fader.deflection"
      @input="onSliderChangeHandler"
      :metadata="sliderMetadata"
    />
    <div class="controls">
      <i class="icon-button icon-audio"
         title="click to switch off"
         v-if="!audioSource.muted"
         @click="setMuted(true)"
      >
      </i>
      <i
        class="icon-button icon-mute"
        title="click to switch on"
        v-if="audioSource.muted"
        @click="setMuted(false)"
      >
      </i>
      <i
        class="icon-button icon-settings"
        @click="showSourceMenu(audioSource.sourceId)"
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
  .padding-h-sides(2);
  .padding-v-sides();

  .source-name {
    flex: 1
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

  .controls {
    width: 60px;
    text-align: right;
    flex: 0 0 60px;

    .fa-volume-off {
      color: @red;
    }
  }
}

</style>
