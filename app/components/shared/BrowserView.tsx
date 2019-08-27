import TsxComponent from 'components/tsx-component';
import electron from 'electron';
import path from 'path';
import { I18nService } from 'services/i18n';
import { Spinner } from 'streamlabs-beaker';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { AppService } from 'services/app';
import { Inject } from 'services';

@Component({ components: { Spinner } })
export default class BrowserView extends TsxComponent<{
  src: string;
  hidden: boolean;
  options: Electron.BrowserViewConstructorOptions;
  setLocale: boolean;
  enableGuestApi: boolean;
}> {
  @Prop() src: string;
  @Prop({ default: false }) hidden: boolean;
  @Prop({
    default: () => {
      return {};
    },
  })
  options: Electron.BrowserViewConstructorOptions;
  @Prop({ default: false }) setLocale: boolean;
  @Prop({ default: false }) enableGuestApi: boolean;

  @Inject() appService: AppService;

  $refs: {
    sizeContainer: HTMLDivElement;
  };

  browserView: Electron.BrowserView;
  resizeInterval: number;
  currentPosition: IVec2;
  currentSize: IVec2;

  loading = true;

  shutdownSubscription: Subscription;

  mounted() {
    this.options.webPreferences = this.options.webPreferences || {};

    // Enforce node integration disabled to prevent security issues
    this.options.webPreferences.nodeIntegration = false;

    if (this.enableGuestApi) {
      this.options.webPreferences.preload = path.resolve(
        electron.remote.app.getAppPath(),
        'bundles',
        'guest-api',
      );
    }

    this.browserView = new electron.remote.BrowserView(this.options);
    this.$emit('ready', this.browserView);

    if (this.setLocale) I18nService.setBrowserViewLocale(this.browserView);

    this.browserView.webContents.on('did-finish-load', () => (this.loading = false));

    electron.remote.getCurrentWindow().addBrowserView(this.browserView);

    this.browserView.webContents.loadURL(this.src);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);

    this.shutdownSubscription = this.appService.shutdownStarted.subscribe(() => {
      // Prevent zombie processes by destroying the browser view
      if (this.browserView && !this.browserView.isDestroyed()) this.browserView.destroy();
    });
  }

  destroyed() {
    electron.remote.getCurrentWindow().removeBrowserView(this.browserView);
    this.browserView.destroy();
    clearInterval(this.resizeInterval);
    this.shutdownSubscription.unsubscribe();
  }

  checkResize() {
    if (this.loading) return;
    if (!this.$refs.sizeContainer) return;

    const rect: { left: number; top: number; width: number; height: number } = this.hidden
      ? { left: 0, top: 0, width: 0, height: 0 }
      : this.$refs.sizeContainer.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.browserView.setBounds({
        x: Math.round(this.currentPosition.x),
        y: Math.round(this.currentPosition.y),
        width: Math.round(this.currentSize.x),
        height: Math.round(this.currentSize.y),
      });
    }
  }

  private rectChanged(rect: { left: number; top: number; width: number; height: number }) {
    return (
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y ||
      rect.width !== this.currentSize.x ||
      rect.height !== this.currentSize.y
    );
  }

  render(h: Function) {
    if (this.loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <spinner size="large" />
        </div>
      );
    }

    return <div ref="sizeContainer" />;
  }
}
