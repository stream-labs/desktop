import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject }from 'util/injector';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import Util from 'services/utils';

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

  mounted() {
    this.$refs.appView.addEventListener('dom-ready', () => {
      if (Util.isDevMode()) {
        this.$refs.appView.openDevTools();
      }
    });
  }

  get appUrl() {
    return this.platformAppsService.getPageUrlForSlot(
      this.params.appId,
      EAppPageSlot.TopNav
    );
  }

}
