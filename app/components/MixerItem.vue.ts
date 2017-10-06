import Vue from 'vue';
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
    this.data.level = level;
    this.data.peak = peak;
    this.draw();
  }

  draw() {
    this.levelElement.style.transform = `scale(${this.data.level}, 1.0)`;
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
    this.subscribeVolmeter();
    this.volmeter = new MixerVolmeter(this.$refs.level as HTMLElement, this.$refs.peak as HTMLElement, 50);
  }


  destroyed() {
    this.unsubscribeVolmeter();
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
