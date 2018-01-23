import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/subscription';
import { AudioSource } from '../services/audio';

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
    this.levelElement.style.transform = `scale(${this.data.level}, 1.0)`;
    this.peakElement.style.left = `${100 * this.data.peak}%`;
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
      this.volmeter.setData(volmeter.level, volmeter.peak);
    });
  }

  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }
}
