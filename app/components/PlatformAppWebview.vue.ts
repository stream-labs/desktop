import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/Subscription';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';
import electron from 'electron';

@Component({})
export default class PlatformAppWebview extends Vue {

  @Inject() platformAppsService: PlatformAppsService;
  @Prop() appId: string;
  @Prop() pageSlot: EAppPageSlot;

  $refs: {
    appView: Electron.WebviewTag;
  }

  reloadSub: Subscription;

  renderWebview = true;

  mounted() {
    this.attachWebviewListeners();

    this.reloadSub = this.platformAppsService.appReload.subscribe((appId) => {
      if (this.appId === appId) {
        this.renderWebview = false;

        // This feels like a massive code smell.
        // Ideally we would have a better way to destroy and
        // recreate the webcontents
        this.$nextTick(() => {
          this.renderWebview = true

          this.$nextTick(() => {
            this.attachWebviewListeners();
          });
        });
      }
    });
  }

  attachWebviewListeners() {
    if (!this.$refs.appView) return;

    this.$refs.appView.addEventListener('dom-ready', () => {
      if (this.platformAppsService.state.devMode) {
        this.$refs.appView.openDevTools();
      }

      // We have to do this in the dom-ready listener.  It seems that if
      // we attempt to fetch the webContents too early, the initial webContents
      // is destroyed and it is replaced with another one.
      const webContents = this.$refs.appView.getWebContents();

      this.platformAppsService.exposeAppApi(this.appId, webContents.id);

      /**
       * This has to be done from the main process to work properly
       * @see https://github.com/electron/electron/issues/1378
       */
      electron.ipcRenderer.send('webContents-preventNavigation', webContents.id);
    });
  }

  destroyed() {
    this.reloadSub.unsubscribe();
  }

  get appUrl() {
    console.log('appUrl: ', this.platformAppsService.getPageUrlForSlot(
      this.appId,
      this.pageSlot
    ));
    return this.platformAppsService.getPageUrlForSlot(
      this.appId,
      this.pageSlot
    );
  }

  get appPartition() {
    console.log('App partition: ', this.platformAppsService.getAppPartition(this.appId));
    return this.platformAppsService.getAppPartition(this.appId);
  }

}
