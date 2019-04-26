import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron from 'electron';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { I18nService } from 'services/i18n';

@Component({})
export default class BrowserFrame extends Vue {
  @Inject() userService: UserService;

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

  @Prop()
  languageCookie: boolean;

  @Prop({ default: electron.remote.getCurrentWindow().id })
  windowId: number;

  private view: Electron.BrowserView;

  get id() {
    return this.view.webContents.id;
  }

  created() {
    this.initView();
    this.attachView(this.windowId);
  }

  destroyed() {
    this.deinitView();
    this.detachView(this.windowId);
  }

  private attachView(electronWindowId: number) {
    if (!this.view) return;

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // @ts-ignore: This method was added in our fork
    win.addBrowserView(this.view);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  private initView() {
    if (this.view) return;

    this.view = new electron.remote.BrowserView({
      webPreferences: {
        partition: this.partition,
        nodeIntegration: false,
      },
    });

    this.injectLanguageCookie();
    this.setupListeners();

    this.view.webContents.loadURL(this.url);
  }

  private setupListeners() {
    this.view.webContents.on('new-window', (evt, targetUrl) => {
      if (this.openRemote) {
        electron.remote.shell.openExternal(targetUrl);
      }
    });
    this.view.webContents.on('did-finish-load', () => {
      this.$emit('did-finish-load');
    });
  }

  private injectLanguageCookie() {
    if (this.languageCookie) {
      const i18nService = I18nService.instance as I18nService; // TODO: replace with getResource('I18nService')
      const locale = i18nService.state.locale;
      this.view.webContents.executeJavaScript(`
      var langCode = $.cookie('langCode');
      if (langCode !== '${locale}') {
         $.cookie('langCode', '${locale}');
      }
      `);
    }
  }

  private deinitView() {
    // @ts-ignore: typings are incorrect
    this.view.destroy();
    this.view = null;
    clearInterval(this.resizeInterval);
  }

  private detachView(electronWindowId: number) {
    if (!this.view) return;

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // @ts-ignore: this method was added in our fork
    win.removeBrowserView(this.chatView);
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
    if (!this.view) return;

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
