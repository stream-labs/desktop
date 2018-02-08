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
function clamp(value: number, min: number, max: number) {
  return (value < min) ? (min) : ((value > max) ? (max) : (value));
}

// This class manages animating the volmeter.  If this needs to
// be used elsewhere in the future it can be extracted to
// another file.
class Volmeter {
  data: {
    level: number;
    peak: number;
  };

  constructor(
    private levelElement: HTMLElement,
    private peakElement: HTMLElement,
    private interval: number
  ) {
    this.data = { level: 0, peak: 0 };
  }

  setData(level: number, peak: number) {
    this.data.level = level;
    this.data.peak = peak;
    this.draw();
  }

  draw() {
    let magScale = 0.0;
    let peakScale = 0.0;

    if (isFinite(this.data.level))
      magScale =  clamp(((-60 - this.data.level) / -60), 0.0, 1.0);

    if (isFinite(this.data.peak))
      peakScale = clamp(((-60 - this.data.peak) / -60), 0.0, 1.0);

    this.levelElement.style.transform = `scale(${peakScale}, 60.0)`;
    this.peakElement.style.left = `${100 * magScale}%`;
  }
}

@Component({})
export default class MixerVolmeter extends Vue {
  @Prop() audioSource: AudioSource;

  volmeterSubscription: Subscription;
  volmeter: Volmeter;

  mounted() {
    this.subscribeVolmeter();
    this.volmeter = new Volmeter(
      this.$refs.level as HTMLElement,
      this.$refs.peak as HTMLElement,
      50
    );
  }

  destroyed() {
    this.unsubscribeVolmeter();
  }


  subscribeVolmeter() {
    this.volmeterSubscription = this.audioSource.subscribeVolmeter(volmeter => {
      this.volmeter.setData(Math.max(...volmeter.magnitude), Math.max(...volmeter.peak));
    });
  }

  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }
}
