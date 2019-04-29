import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron, { BrowserView } from 'electron';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { BrowserFrameService } from 'services/browser-frame';

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

  private containerId: number;
  private view: Electron.BrowserView;

  get id() {
    return this.view.webContents.id;
  }

  created() {
    this.containerId = this.browserFrameService.mountView({
      affinity: this.affinity,
      partition: this.partition,
      preload: this.preload,
      persistent: this.persistent,
      url: this.url,
      windowId: this.windowId,
    });

    this.view = this.browserFrameService.getView(this.containerId, this.windowId);

    this.setupListeners(this.view);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  destroyed() {
    this.browserFrameService.unmountView(this.containerId, this.windowId);
    clearInterval(this.resizeInterval);
  }

  onFinishLoad(callback: Function) {
    this.view.webContents.on('did-finish-load', callback);
  }

  openDevTools() {
    this.view.webContents.openDevTools({ mode: 'detach' });
  }

  private setupListeners(view: BrowserView) {
    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (evt, targetUrl) => {
      if (this.openRemote) {
        electron.remote.shell.openExternal(targetUrl);
      } else {
        this.$emit('new-window', evt, targetUrl);
      }
    });
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
