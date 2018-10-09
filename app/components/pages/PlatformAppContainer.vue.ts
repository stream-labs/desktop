import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { EAppPageSlot } from 'services/platform-apps';
import PlatformAppWebview from 'components/PlatformAppWebview.vue';
import { PlatformAppsService } from 'services/platform-apps';
import { Inject } from 'util/injector';

interface IPlatformAppContainerParams {
  appId: string;
  poppedOut: boolean;
}

@Component({
  components: { PlatformAppWebview }
})
export default class PlatformAppContainer extends Vue {

  @Prop() private params: IPlatformAppContainerParams;
  @Inject() private platformAppsService: PlatformAppsService;

  // TODO: Stop hard coding this if we use this component elsewhere
  slot = EAppPageSlot.TopNav;

  get app() {
    return this.platformAppsService.state.loadedApps.find(app => {
      return app.id === this.params.appId;
    });
  }

  get isPopOutAllowed() {
    if (!this.app) return false;

    const topNavPage = this.app.manifest.pages.find(page => page.slot === EAppPageSlot.TopNav);
    if (!topNavPage) return false;

    // Default result is true
    return topNavPage.allowPopout == null ? true : topNavPage.allowPopout;
  }

  popOut() {
    this.platformAppsService.popOutAppPage(this.params.appId, this.slot);
  }

  get isUnpacked() {
    return this.app.unpacked;
  }

  refreshApp() {
    this.platformAppsService.reloadApp(this.params.appId);
  }

}
