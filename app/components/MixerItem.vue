<template>
<div class="mixer-item" :class="{ muted: audioSource.muted}">

  <div class="flex">
    <div class="source-name">{{ audioSource.displayName }}</div>
    <div class="db-value">
      <div v-if="audioSource.fader.deflection == 0">-Inf dB</div>
      <div v-if="audioSource.fader.deflection !== 0">{{ audioSource.fader.db.toFixed(1) }} dB</div>
    </div>
  </div>

  <div class="volmeter">
    <div class="volmeter-level" ref="level"></div>
    <div class="volmeter-peak" ref="peak"></div>
  </div>

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
      <i class="icon-btn fa fa-volume-up"
         title="click to switch off"
         v-if="!audioSource.muted"
         @click="setMuted(true)"
      >
      </i>
      <i
        class="icon-btn fa fa-volume-off"
        title="click to switch on"
        v-if="audioSource.muted"
        @click="setMuted(false)"
      >
      </i>
      <i
        class="icon-btn fa fa-cog"
        @click="showSourceMenu(audioSource.sourceId)"
      >
      </i>
    </div>
  </div>

</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tween from '@tweenjs/tween.js';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/subscription';
import { EditMenu } from '../util/menus/EditMenu';
import { AudioSource } from '../services/audio';
import { ScenesService } from '../services/scenes';
import { Inject } from '../util/injector';
import Slider from  './shared/Slider.vue';

// This class manages animating the volmeter.  If this needs to
// be used elsewhere in the future it can be extracted to
// another file.
class MixerVolmeter {

  data: {
    level: number;
    peak: number;
  };

  shouldContinue = true;

  constructor(
    private levelElement: HTMLElement,
    private peakElement: HTMLElement,
    private interval: number) {

    this.data = { level: 0, peak: 0 };
  }

  setData(level: number, peak: number) {
    (new Tween.Tween(this.data)).to({ level, peak }, this.interval).start();
  }

  animate() {
    if (this.shouldContinue) window.requestAnimationFrame(() => this.animate());
    Tween.update();
    this.draw();
  }

  stop() {
    this.shouldContinue = false;
  }

  draw() {
    this.levelElement.style.right = `${100 - (this.data.level * 100)}%`;
    this.peakElement.style.left = `${100 * this.data.peak}%`;
  }

}

@Component({
  components: { Slider }
})
export default class MixerItem extends Vue {

  @Prop()
  audioSource: AudioSource;

  @Inject()
  scenesService: ScenesService;

  volmeterSubscription: Subscription;

  volmeter: MixerVolmeter;

  mounted() {
    if (!this.audioSource.muted) this.subscribeVolmeter();
    this.volmeter = new MixerVolmeter(this.$refs.level as HTMLElement, this.$refs.peak as HTMLElement, 50);
    this.volmeter.animate();
  }


  destroyed() {
    this.unsubscribeVolmeter();
    this.volmeter.stop();
  }


  setMuted(muted: boolean) {
    this.audioSource.setMuted(muted);
  }


  subscribeVolmeter() {
    this.volmeterSubscription = this.audioSource.subscribeVolmeter(volmeter => {
      this.volmeter.setData(volmeter.level, volmeter.peak);
    });
  }


  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }


  onSliderChangeHandler(newVal: number) {
    this.audioSource.setDeflection(newVal);
  }

  showSourceMenu(sourceId: string) {
    const menu = new EditMenu({ selectedSourceId: sourceId});
    menu.popup();
  }

}
</script>

<style lang="less" scoped>
@import "../styles/index";

.mixer-item {
  position: relative;
  padding: 10px 12px;

  .source-name {
    flex: 1
  }

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

    .volmeter-level {
      .absolute(0, 100%, 0, 0);
      background-color: @teal;
    }

    .volmeter-peak {
      .absolute(0, auto, 0, 0);
      width: 2px;
      background-color: @input-border-color;
    }
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

    .fa-volume-off {
      color: @red;
    }
  }
}

.night-theme {
  .volmeter {
    background-color: @night-slider-bg;
  }
}
</style>
