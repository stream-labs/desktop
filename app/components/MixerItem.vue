<template>
<div class="MixerItem" :class="{ muted: audioSource.muted}">

  <div class="flex">
    <div class="source-name">{{ audioSource.name }}</div>
    <div class="db-value">
      <div v-if="audioSource.fader.deflection == 0">-Inf dB</div>
      <div v-if="audioSource.fader.deflection !== 0">{{ audioSource.fader.db.toFixed(1) }} dB</div>
    </div>
  </div>

  <div class="volmeter">
    <div class="volmeter-progress" :style="volmeter && { right: 100 - (volmeter.level * 100) + '%' }"></div>
    <div class="volmeter-peak" :style="volmeter && { left: 100 * volmeter.peak + '%' }"></div>
  </div>

  <div class="flex">
    <Slider
      :value="audioSource.fader.deflection"
      :min="0"
      :max="1"
      :interval="0.01"
      @input="onSliderChangeHandler"
    />
    <div class="controls">
      <i class="ico-btn fa fa-volume-up"
         title="click to switch off"
         v-if="!audioSource.muted"
         @click="setMuted(true)"
      >
      </i>
      <i
        class="ico-btn fa fa-volume-off"
        title="click to switch on"
        v-if="audioSource.muted"
        @click="setMuted(false)"
      >
      </i>
    </div>
  </div>

</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/subscription';
import { AudioService, IAudioSource, IVolmeter } from '../services/audio';
import { Inject } from '../services/service';
import Slider from  './shared/Slider.vue';

@Component({
  components: { Slider }
})
export default class Mixer extends Vue {

  @Prop()
  audioSource: IAudioSource;

  @Inject()
  audioService: AudioService;

  volmeter: IVolmeter = null;
  volmeterSubscription: Subscription;

  mounted() {
    if (!this.audioSource.muted) this.subscribeVolmeter();
  }

  destroyed() {
    this.unsubscribeVolmeter();
  }


  setMuted(muted: boolean) {
    this.audioService.setMuted(this.audioSource.id, muted);
    if (muted) {
      this.unsubscribeVolmeter();
      this.volmeter = { ...this.volmeter, peak: 0, level: 0 };
    } else {
      this.subscribeVolmeter();
    }
  }


  subscribeVolmeter() {
    this.volmeterSubscription = this.audioService.subscribeVolmeter(
      this.audioSource.name, volmeter => this.volmeter = volmeter
    );
  }

  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }


  onSliderChangeHandler(newVal: number) {
    this.audioService.setDeflection(this.audioSource.name, newVal);
  }
}
</script>

<style lang="less" scoped>
@import "../styles/index";

.MixerItem {
  position: relative;
  padding: 10px;


  .source-name { flex: 1}

  .db-value {
    width: 60px;
    text-align: right;
  }

  .volmeter {
    position: relative;
    overflow: hidden;
    margin: 10px 0;
    height: 4px;
    border-radius: 4px;
    background-color: @slider-background-color;

    .volmeter-progress {
      .absolute(0, 100%, 0, 0);
      background-color: @teal;
    }

    .volmeter-peak {
      .absolute(0, auto, 0, 0);
      width: 2px;
      background-color: @input-border-color;
    }
  }

  .Slider {
    flex: 1;
    margin-left: -8px;
  }

  &.muted .Slider {
    opacity: 0.4;
  }

  .controls {
    width: 30px;
    text-align: center;
    font-size: 16px;
    margin-top: -2px;
    .fa-volume-off { color: @red }
  }
}
</style>
