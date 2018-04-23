import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { Display as ObsDisplay, VideoService } from '../services/video';

@Component({})
export default class Display extends Vue {

  @Inject() videoService: VideoService;

  @Prop({ default: true }) drawUI: boolean;
  @Prop({ default: 10 }) paddingSize: number;

  obsDisplay: ObsDisplay;

  $refs: {
    display: HTMLDivElement;
  };

  mounted() {
    const displayId = this.videoService.getRandomDisplayId();
    this.obsDisplay = new ObsDisplay(displayId, { paddingSize: this.paddingSize });
    this.obsDisplay.onOutputResize(outputRegion => this.$emit('outputResize', outputRegion));
    this.obsDisplay.trackElement(this.$refs.display);
    this.obsDisplay.setShoulddrawUI(this.drawUI);
  }

  beforeDestroy() {
    this.obsDisplay.destroy();
  }

}
