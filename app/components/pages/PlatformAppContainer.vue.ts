import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject }from 'util/injector';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import Util from 'services/utils';
import { Subscription } from 'rxjs/Subscription';

interface IPlatformAppContainerParams {
  appId: string;
}

@Component({})
export default class PlatformAppContainer extends Vue {

  @Prop() private params: IPlatformAppContainerParams;
  @Inject() private platformAppsService: PlatformAppsService;

  $refs: {
    appView: Electron.WebviewTag;
  }

  reloadSub: Subscription

  mounted() {
    this.$refs.appView.addEventListener('dom-ready', () => {
      if (Util.isDevMode()) {
        this.$refs.appView.openDevTools();
      }
    });

    this.reloadSub = this.platformAppsService.appReload.subscribe((appId) => {
      if (this.params.appId === appId) {
        this.$refs.appView.reload();
      }
    });
  }

  destroyed() {
    this.reloadSub.unsubscribe();
  }

  get appUrl() {
    return this.platformAppsService.getPageUrlForSlot(
      this.params.appId,
      EAppPageSlot.TopNav
    );
  }

}
