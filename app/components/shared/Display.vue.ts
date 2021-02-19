import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { VideoService, Display as OBSDisplay } from 'services/video';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import uuid from 'uuid/v4';

interface DisplayProps {
  sourceId?: string;
  paddingSize?: number;
  drawUI?: false;
  renderingMode?: number;
  onOutputResize?: (region: IRectangle) => void;
}

@Component({})
export default class Display extends TsxComponent<DisplayProps> {
  @Inject() videoService: VideoService;
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;

  @Prop() sourceId: string;
  @Prop({ default: 0 }) paddingSize: number;
  @Prop({ default: false }) drawUI: boolean;
  @Prop() renderingMode: number;

  $refs: {
    display: HTMLElement;
  };

  display: OBSDisplay;

  mounted() {
    this.createDisplay();
  }

  onClickHandler(event: MouseEvent) {
    this.$emit('click', event);
  }

  get paddingColor() {
    return this.customizationService.displayBackground;
  }

  createDisplay() {
    const displayId = uuid();
    this.display = new OBSDisplay(displayId, {
      sourceId: this.sourceId,
      paddingSize: this.paddingSize,
      paddingColor: this.paddingColor,
      renderingMode: this.renderingMode,
    });
    this.display.setShoulddrawUI(this.drawUI);

    this.display.onOutputResize(region => {
      this.$emit('outputResize', region);
    });

    this.display.trackElement(this.$refs.display);
  }

  destroyDisplay() {
    this.display.destroy();
  }

  @Watch('sourceId')
  changeSource() {
    this.updateDisplay();
  }

  @Watch('paddingColor')
  updateDisplay() {
    this.destroyDisplay();
    this.createDisplay();
  }

  get baseResolution() {
    return this.videoService.baseResolution;
  }

  @Watch('baseResolution')
  refreshOutputRegion() {
    if (this.display) this.display.refreshOutputRegion();
  }

  beforeDestroy() {
    this.destroyDisplay();
  }
}
