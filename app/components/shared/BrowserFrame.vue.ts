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

  private view: Electron.BrowserView;

  get id() {
    return this.view.webContents.id;
  }

  created() {
    const currentView = this.browserFrameService.getView(this.name);

    if (!currentView) {
      this.view = this.browserFrameService.addView(this.name, {
        affinity: this.affinity,
        partition: this.partition,
        preload: this.preload,
        url: this.url,
        windowId: this.windowId,
      });

      this.setupListeners(this.view);
    } else {
      this.view = currentView.view;

      if (this.persistent ) {
        this.browserFrameService.showView(this.name);
        this.checkResize();
      }
    }

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  destroyed() {
    if (this.persistent) {
      this.browserFrameService.hideView(this.name);
    } else {
      this.browserFrameService.removeView(this.name);
    }
    //
    clearInterval(this.resizeInterval);
  }

  public openDevTools() {
    this.browserFrameService.getView(this.name).view.webContents.openDevTools({ mode: 'detach' });
  }

  private setupListeners(view: BrowserView) {
    view.webContents.on('new-window', (evt, targetUrl) => {
      if (this.openRemote) {
        electron.remote.shell.openExternal(targetUrl);
      } else {
        this.$emit('new-window', [evt, targetUrl]);
      }
    });

    view.webContents.on('did-finish-load', () => {
      this.$emit('did-finish-load');
    });
  }

  private checkResize() {
    if (!this.$refs.embedLocation) return;

    const rect = this.$refs.embedLocation.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.setBounds(this.currentPosition, this.currentSize);
    }
  }

  private setBounds(position: IVec2, size: IVec2) {
    this.view.setBounds({
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: Math.round(size.x),
      height: Math.round(size.y),
    });
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
