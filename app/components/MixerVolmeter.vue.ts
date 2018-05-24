import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/subscription';
import { AudioSource } from '../services/audio';

// From Qt OBS
const minimumLevel = -60.0;                               // -60 dB
const warningLevel = -20.0;                               // -20 dB
const errorLevel = -9.0;                                  //  -9 dB
const clipLevel = -0.5;                                   //  -0.5 dB
const minimumInputLevel = -50.0;                          // -50 dB
const peakDecayRate = 11.76;                              //  20 dB / 1.7 sec
const magnitudeIntegrationTime = 0.3;                     //  99% in 300 ms
const peakHoldDuration = 20.0;                            //  20 seconds
const inputPeakHoldDuration = 1.0; //  1 second

/* Javascript doesn't have a native clamp function...? */
// function clamp(value: number, min: number, max: number) {
//   return (value < min) ? (min) : ((value > max) ? (max) : (value));
// }

// // This class manages animating the volmeter.  If this needs to
// // be used elsewhere in the future it can be extracted to
// // another file.
// class Volmeter {
//   data: {
//     level: number;
//     peak: number;
//   };

//   constructor(
//     private levelElement: HTMLElement,
//     private peakElement: HTMLElement,
//     private interval: number
//   ) {
//     this.data = { level: 0, peak: 0 };
//   }

//   setData(level: number, peak: number) {
//     this.data.level = level;
//     this.data.peak = peak;
//     this.draw();
//   }

//   draw() {
//     let magScale = 0.0;
//     let peakScale = 0.0;

//     if (isFinite(this.data.level))
//       magScale =  clamp(((-60 - this.data.level) / -60), 0.0, 1.0);

//     if (isFinite(this.data.peak))
//       peakScale = clamp(((-60 - this.data.peak) / -60), 0.0, 1.0);

//     this.levelElement.style.transform = `scale(${peakScale}, 60.0)`;
//     this.peakElement.style.left = `${100 * magScale}%`;
//   }
// }

// Configuration
const CANVAS_RESOLUTION = 600;
const PEAK_WIDTH = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;

// Colors
const GREEN = '#31c3a2';
const GREEN_BG = '#186151';
const YELLOW = '#ffcd47';
const YELLOW_BG = '#7f6623';
const RED = '#fc3e3f';
const RED_BG = '#7e1f1f';

@Component({})
export default class MixerVolmeter extends Vue {
  @Prop() audioSource: AudioSource;

  volmeterSubscription: Subscription;

  $refs: {
    canvas: HTMLCanvasElement;
  };

  ctx: CanvasRenderingContext2D;

  peakHoldCounter: number;
  peakHold: number;

  mounted() {
    this.subscribeVolmeter();
    this.$refs.canvas.width = CANVAS_RESOLUTION;
    this.$refs.canvas.height = 1;
    this.ctx = this.$refs.canvas.getContext('2d');
  }

  destroyed() {
    this.unsubscribeVolmeter();
  }

  drawVolmeter(peak: number) {
    this.updatePeakHold(peak);

    this.ctx.clearRect(0, 0, CANVAS_RESOLUTION, 1);

    const warningPx = this.dbToPx(WARNING_LEVEL);
    const dangerPx = this.dbToPx(DANGER_LEVEL);

    this.ctx.fillStyle = GREEN_BG;
    this.ctx.fillRect(0, 0, warningPx, 1);
    this.ctx.fillStyle = YELLOW_BG;
    this.ctx.fillRect(warningPx, 0, dangerPx - warningPx, 1);
    this.ctx.fillStyle = RED_BG;
    this.ctx.fillRect(dangerPx, 0, CANVAS_RESOLUTION - dangerPx, 1);

    const peakPx = this.dbToPx(peak);

    const greenLevel = Math.min(peakPx, warningPx);
    this.ctx.fillStyle = GREEN;
    this.ctx.fillRect(0, 0, greenLevel, 1);

    if (peak > WARNING_LEVEL) {
      const yellowLevel = Math.min(peakPx, dangerPx);
      this.ctx.fillStyle = YELLOW;
      this.ctx.fillRect(warningPx, 0, yellowLevel - warningPx, 1);
    }

    if (peak > DANGER_LEVEL) {
      this.ctx.fillStyle = RED;
      this.ctx.fillRect(dangerPx, 0, peakPx - dangerPx, 1);
    }

    this.ctx.fillStyle = GREEN;
    if (this.peakHold > WARNING_LEVEL) this.ctx.fillStyle = YELLOW;
    if (this.peakHold > DANGER_LEVEL) this.ctx.fillStyle = RED;
    this.ctx.fillRect(this.dbToPx(this.peakHold) - (PEAK_WIDTH / 2), 0, PEAK_WIDTH, 1);
  }

  dbToPx(db: number) {
    return (db + 60) * (CANVAS_RESOLUTION / 60);
  }

  updatePeakHold(peak: number) {
    if (!this.peakHoldCounter || (peak > this.peakHold)) {
      this.peakHold = peak;
      this.peakHoldCounter = PEAK_HOLD_CYCLES;
      return;
    }

    this.peakHoldCounter -= 1;
  }

  subscribeVolmeter() {
    this.volmeterSubscription = this.audioSource.subscribeVolmeter(volmeter => {
      // console.log(volmeter);
      this.drawVolmeter(volmeter.peak[0]);
    });
  }

  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }
}
