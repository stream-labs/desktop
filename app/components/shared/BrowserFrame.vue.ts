import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron, { BrowserView } from 'electron';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { BrowserFrameService } from 'services/browser-frame';
import { IRequestHandler, GuestApiService } from 'services/guest-api';

@Component({})
export default class BrowserFrame extends Vue {
  @Inject() userService: UserService;
  @Inject() browserFrameService: BrowserFrameService;

  $refs: {
    embedLocation: HTMLDivElement;
  };
  private currentPosition: IVec2;
  private currentSize: IVec2;
  private resizeInterval: number;

  @Prop()
  url: string;

  @Prop()
  partition: string;

  @Prop()
  openRemote: boolean;

  @Prop({ default: electron.remote.getCurrentWindow().id })
  windowId: number;

  @Prop()
  preload: string;

  @Prop()
  affinity: string;

  @Prop()
  name: string;

  @Prop()
  persistent: boolean;

  @Prop()
  requestHandler: IRequestHandler;

  @Prop()
  onNewWindow: (event: Electron.Event, url: string) => void;

  private containerId: number;
  private view: Electron.BrowserView;

  created() {
    this.containerId = this.browserFrameService.mountView({
      affinity: this.affinity,
      partition: this.partition,
      preload: this.preload,
      persistent: this.persistent,
      url: this.url,
      windowId: this.windowId,
      requestHandler: this.requestHandler,
      openRemote: this.openRemote,
      onNewWindow: this.onNewWindow,
    });

    this.view = this.browserFrameService.getView(this.containerId, this.windowId);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  destroyed() {
    this.browserFrameService.unmountView(this.containerId, this.windowId);
    clearInterval(this.resizeInterval);
  }

  private checkResize() {
    if (!this.$refs.embedLocation) return;

    const rect = this.$refs.embedLocation.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.browserFrameService.setViewBounds(
        this.containerId,
        this.currentPosition,
        this.currentSize,
      );
    }
  }

  private rectChanged(rect: ClientRect) {
    return (
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y ||
      rect.width !== this.currentSize.x ||
      rect.height !== this.currentSize.y
    );
  }
}
