import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs/Subscription';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';

@Component({})
export default class PlatformAppWebview extends Vue {

  @Inject() platformAppsService: PlatformAppsService;
  @Prop() appId: string;
  @Prop() pageSlot: EAppPageSlot;

  $refs: {
    appView: Electron.WebviewTag;
  }

  reloadSub: Subscription;

  mounted() {
    this.$refs.appView.addEventListener('dom-ready', () => {
      if (this.platformAppsService.devMode) {
        this.$refs.appView.openDevTools();
      }

      this.platformAppsService.exposeAppApi(this.appId, this.$refs.appView.getWebContents().id);
    });

    this.reloadSub = this.platformAppsService.appReload.subscribe((appId) => {
      if (this.appId === appId) {
        this.$refs.appView.reload();
      }
    });
  }

  destroyed() {
    this.reloadSub.unsubscribe();
  }

  get appUrl() {
    return this.platformAppsService.getPageUrlForSlot(
      this.appId,
      this.pageSlot
    );
  }


}
