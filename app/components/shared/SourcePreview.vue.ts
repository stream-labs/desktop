import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import electron from 'electron';
import { Inject } from '../../util/injector';
import { VideoService, Display } from 'services/video';
import { WindowsService } from 'services/windows';

const { remote } = electron;

@Component({})
export default class SourcePreview extends Vue {
  @Inject() videoService: VideoService;
  @Inject() windowsService: WindowsService;

  @Prop() sourceId: string;

  $refs: {
    preview: HTMLElement
  };

  display: Display;

  mounted() {
    this.createDisplay();
  }

  createDisplay() {
    const displayId = this.videoService.getRandomDisplayId();
    this.display = new Display(displayId, { sourceId: this.sourceId });
    this.display.trackElement(this.$refs.preview);
  }

  destroyDisplay() {
    this.display.destroy();
  }

  @Watch('sourceId')
  changeSource() {
    this.destroyDisplay();
    this.createDisplay();
  }

  beforeDestroy() {
    this.destroyDisplay();
  }

}
