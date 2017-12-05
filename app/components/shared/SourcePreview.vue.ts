import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { ObsApiService } from '../../services/obs-api';
import electron from 'electron';
import { Inject } from '../../util/injector';
import { VideoService } from '../../services/video';
import { WindowsService } from '../../services/windows';

const { remote } = electron;

@Component({})
export default class SourcePreview extends Vue {

  @Inject()
  obsApiService: ObsApiService;

  @Inject()
  videoService: VideoService;

  @Inject()
  windowsService: WindowsService;

  @Prop()
  sourceId: string;

  $refs: {
    preview: HTMLElement
  };

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  created() {
    this.createDisplay();
  }

  @Watch('sourceId')
  changeSource() {
    this.destroyDisplay();
    this.createDisplay();
    this.onResize();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.destroyDisplay();
  }

  createDisplay() {
    this.obsApiService.createSourceDisplay(
      this.sourceId,
      'Preview Window',
      remote.getCurrentWindow().getNativeWindowHandle()
    );
  }

  destroyDisplay() {
    this.obsApiService.removeSourceDisplay('Preview Window');
  }

  onResize() {
    const preview = this.$refs.preview;
    const factor = this.windowsService.state.child.scaleFactor;
    const rect = preview.getBoundingClientRect();

    this.obsApiService.resizeDisplay(
      'Preview Window',
      rect.width * factor,
      rect.height * factor
    );

    this.obsApiService.moveDisplay(
      'Preview Window',
      rect.left * factor,
      rect.top * factor
    );
  }

}
