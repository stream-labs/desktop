import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';
import electron from 'electron';
import Utils from 'services/utils';

@Component({})
export default class PlatformAppWebview extends Vue {
  @Inject() platformAppsService: PlatformAppsService;
  // @Prop() appId: string;
  // @Prop() pageSlot: EAppPageSlot;
  @Prop() params: { appId: string; pageSlot: EAppPageSlot };
  @Prop({ default: true }) visible: boolean;

  $refs: {
    resizeContainer: HTMLDivElement;
  };

  reloadSub: Subscription;

  resizeInterval: number;

  containerId: number;

  mounted() {
    // this.transformSubjectId = this.platformAppsService.createTransformSubject({
    //   pos: { x: 0, y: 0 },
    //   size: { x: 0, y: 0 },
    //   visible: this.visible,
    //   electronWindowId: electron.remote.getCurrentWindow().id,
    //   slobsWindowId: Utils.getWindowId(),
    // });

    this.attachWebviewListeners();

    // TODO: Remove Popout from this component
    if (!this.poppedOut) {
      // const viewId = this.platformAppsService.getPageContainerIdForSlot(this.appId, this.pageSlot);
      // const view = electron.remote.BrowserView.fromId(viewId);
      // const win = electron.remote.getCurrentWindow();
      // (win as any).addBrowserView(view);
      // const rect = this.$refs.resizeContainer.getBoundingClientRect();
      // view.setBounds({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      this.containerId = this.platformAppsService.mountConatiner(
        this.appId,
        this.pageSlot,
        electron.remote.getCurrentWindow().id,
        Utils.getWindowId(),
      );
      this.checkResize();

      this.resizeInterval = window.setInterval(() => {
        this.checkResize();
      }, 100); // TODO: Is this too fast?
    }

    // TODO: Handle reloads

    // this.reloadSub = this.platformAppsService.appReload.subscribe(appId => {
    //   if (this.appId === appId) {
    //     this.renderWebview = false;

    //     // This feels like a massive code smell.
    //     // Ideally we would have a better way to destroy and
    //     // recreate the webcontents
    //     this.$nextTick(() => {
    //       this.renderWebview = true;

    //       this.$nextTick(() => {
    //         this.attachWebviewListeners();
    //       });
    //     });
    //   }
    // });
  }

  @Watch('poppedOut')
  handlePopoutChange() {
    this.$nextTick(() => this.attachWebviewListeners());
  }

  get poppedOut() {
    return Utils.isMainWindow() &&
      this.platformAppsService.getApp(this.appId).poppedOutSlots.includes(this.pageSlot);
  }

  attachWebviewListeners() {
    // if (!this.$refs.appView) return;

    // this.$refs.appView.addEventListener('did-finish-load', () => {
    //   const app = this.platformAppsService.getApp(this.appId);

    //   if (app.unpacked) {
    //     this.$refs.appView.openDevTools();
    //   }

    //   // We have to do this in the dom-ready listener.  It seems that if
    //   // we attempt to fetch the webContents too early, the initial webContents
    //   // is destroyed and it is replaced with another one.
    //   const webContents = this.$refs.appView.getWebContents();

    //   this.platformAppsService.exposeAppApi(
    //     this.appId,
    //     webContents.id,
    //     electron.remote.getCurrentWindow().id,
    //     Utils.getCurrentUrlParams().windowId,
    //     this.transformSubjectId,
    //   );

    //   /**
    //    * This has to be done from the main process to work properly
    //    * @see https://github.com/electron/electron/issues/1378
    //    */
    //   electron.ipcRenderer.send('webContents-preventNavigation', webContents.id);

    //   // We allow opening dev tools for beta apps only
    //   if (app.beta) {
    //     webContents.on('before-input-event', (e, input) => {
    //       if (input.type === 'keyDown' && input.code === 'KeyI' && input.control && input.shift) {
    //         this.$refs.appView.openDevTools();
    //       }
    //     });
    //   }
    // });
  }

  destroyed() {
    // this.reloadSub.unsubscribe();
    if (this.resizeInterval) clearInterval(this.resizeInterval);
    this.platformAppsService.unmountContainer(this.containerId);
  }

  // get appUrl() {
  //   return this.platformAppsService.getPageUrlForSlot(this.appId, this.pageSlot);
  // }

  get webviewStyles() {
    return '';
    // if (this.visible) {
    //   return {};
    // }

    // return {
    //   position: 'absolute',
    //   top: '-10000px',
    // };
  }

  currentPosition: IVec2;
  currentSize: IVec2;

  checkResize() {
    const rect = this.$refs.resizeContainer.getBoundingClientRect();

    if (
      this.currentPosition == null ||
      this.currentSize == null ||
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y ||
      rect.width !== this.currentSize.x ||
      rect.height !== this.currentSize.y
    ) {
      this.platformAppsService.setContainerBounds(
        this.containerId,
        { x: rect.left, y: rect.top },
        { x: rect.width, y: rect.height },
      );
    }
  }

  get appId() {
    return this.params.appId;
  }

  get pageSlot() {
    return this.params.pageSlot;
  }
}
