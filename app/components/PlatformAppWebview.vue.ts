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
  @Prop() appId: string;
  @Prop() pageSlot: EAppPageSlot;
  @Prop() poppedOut: boolean;
  @Prop({ default: true }) visible: boolean;

  $refs: {
    appView: Electron.WebviewTag;
    resizeContainer: HTMLDivElement;
  };

  reloadSub: Subscription;

  renderWebview = true;

  transformSubjectId: string;

  resizeInterval: number;

  mounted() {
    this.transformSubjectId = this.platformAppsService.createTransformSubject({
      pos: { x: 0, y: 0 },
      size: { x: 0, y: 0 },
      visible: this.visible,
    });

    this.checkResize();

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 500);

    this.attachWebviewListeners();

    this.reloadSub = this.platformAppsService.appReload.subscribe(appId => {
      if (this.appId === appId) {
        this.renderWebview = false;

        // This feels like a massive code smell.
        // Ideally we would have a better way to destroy and
        // recreate the webcontents
        this.$nextTick(() => {
          this.renderWebview = true;

          this.$nextTick(() => {
            this.attachWebviewListeners();
          });
        });
      }
    });
  }

  @Watch('poppedOut')
  handlePopoutChange() {
    this.$nextTick(() => this.attachWebviewListeners());
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
    // if (this.resizeInterval) clearInterval(this.resizeInterval);
    // this.platformAppsService.removeTransformSubject(this.transformSubjectId);
  }

  // get appUrl() {
  //   return this.platformAppsService.getPageUrlForSlot(this.appId, this.pageSlot);
  // }

  get appPartition() {
    return this.platformAppsService.getAppPartition(this.appId);
  }

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

  checkResize() {
    const rect = this.$refs.resizeContainer.getBoundingClientRect();

    if (
      this.currentPosition == null ||
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y
    ) {
      this.emitTransform();
    }
  }

  @Watch('visible')
  emitTransform() {
    const rect = this.$refs.resizeContainer.getBoundingClientRect();
    this.currentPosition = {
      x: rect.left,
      y: rect.top,
    };

    this.platformAppsService.nextTransformSubject(this.transformSubjectId, {
      pos: { x: rect.left, y: rect.top },
      size: { x: rect.width, y: rect.height },
      visible: this.visible,
    });
  }
}
