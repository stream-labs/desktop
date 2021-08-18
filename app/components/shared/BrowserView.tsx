import TsxComponent, { createProps } from 'components/tsx-component';
import electron from 'electron';
import path from 'path';
import { I18nService } from 'services/i18n';
import { Spinner } from 'streamlabs-beaker';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services';
import { WindowsService } from 'services/windows';
import Utils from 'services/utils';
import { Subscription } from 'rxjs';
import { AppService } from 'services/app';
import cloneDeep from 'lodash/cloneDeep';
import { CustomizationService } from 'services/customization';

class BrowserViewProps {
  src: string = '';
  hidden?: boolean = false;
  options?: Electron.BrowserViewConstructorOptions = null;
  setLocale?: boolean = false;
  enableGuestApi?: boolean = false;
  onReady?: (view: any) => void = () => {};
}

@Component({ props: createProps(BrowserViewProps) })
export default class BrowserView extends TsxComponent<BrowserViewProps> {
  @Inject() windowsService: WindowsService;
  @Inject() appService: AppService;
  @Inject() customizationService: CustomizationService;

  $refs: {
    sizeContainer: HTMLDivElement;
  };

  browserView: Electron.BrowserView;
  resizeInterval: number;
  currentPosition: IVec2;
  currentSize: IVec2;

  loading = true;

  shutdownSubscription: Subscription;

  async mounted() {
    const options = this.props.options ? cloneDeep(this.props.options) : { webPreferences: {} };

    // Enforce node integration disabled to prevent security issues
    options.webPreferences.nodeIntegration = false;

    if (this.props.enableGuestApi) {
      options.webPreferences.enableRemoteModule = true;
      options.webPreferences.contextIsolation = true;
      options.webPreferences.preload = path.resolve(
        electron.remote.app.getAppPath(),
        'bundles',
        'guest-api',
      );
    }

    this.browserView = new electron.remote.BrowserView(options);

    this.$emit('ready', this.browserView);

    if (this.props.setLocale) I18nService.setBrowserViewLocale(this.browserView);

    this.browserView.webContents.on('did-finish-load', () => (this.loading = false));
    electron.remote.getCurrentWindow().addBrowserView(this.browserView);

    await this.loadUrl();

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);

    this.shutdownSubscription = this.appService.shutdownStarted.subscribe(() => {
      this.destroyBrowserView();
    });
  }

  destroyBrowserView() {
    if (this.browserView) {
      electron.remote.getCurrentWindow().removeBrowserView(this.browserView);
      // See: https://github.com/electron/electron/issues/26929
      // @ts-ignore
      this.browserView.webContents.destroy();
      this.browserView = null;
    }
  }

  destroyed() {
    this.destroyBrowserView();
    clearInterval(this.resizeInterval);
    this.shutdownSubscription && this.shutdownSubscription.unsubscribe();
  }

  get hideStyleBlockers() {
    return this.windowsService.state[Utils.getWindowId()].hideStyleBlockers;
  }

  checkResize() {
    if (this.loading) return;
    if (!this.$refs.sizeContainer) return;

    const rect: { left: number; top: number; width: number; height: number } =
      this.props.hidden || this.hideStyleBlockers
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

  get theme() {
    return this.customizationService.state.theme;
  }

  @Watch('theme')
  async loadUrl() {
    try {
      await this.browserView.webContents.loadURL(this.props.src);
    } catch (e: unknown) {
      // ignore some common errors
      // that happen when the window has been closed before BrowserView accomplished the request
      if (typeof e === 'object') {
        if (e['code'] === 'ERR_ABORTED') return;
        if (e['message'] && e['message'].match(/\(\-3\) loading/)) return;
      }
      throw e;
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

  render() {
    if (this.loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="large" />
        </div>
      );
    }

    return <div ref="sizeContainer" />;
  }
}
