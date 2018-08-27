import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { EAppPageSlot } from 'services/platform-apps';
import PlatformAppWebview from 'components/PlatformAppWebview.vue';
import { PlatformAppsService } from 'services/platform-apps';
import { Inject } from 'util/injector';

interface IPlatformAppContainerParams {
  appId: string;
}

@Component({
  components: { PlatformAppWebview }
})
export default class PlatformAppContainer extends Vue {

  @Prop() private params: IPlatformAppContainerParams;
  @Inject() private platformAppsService: PlatformAppsService;

  slot = EAppPageSlot.TopNav;

  popOut() {
    this.platformAppsService.popOutAppPage(this.params.appId, this.slot);
  }

}
