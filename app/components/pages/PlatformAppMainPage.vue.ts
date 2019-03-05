import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import PlatformAppPageView from '../PlatformAppPageView.vue';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';

@Component({
  components: { PlatformAppPageView },
})
export default class PlatformAppMainPage extends Vue {
  @Prop() params: { appId: string };
  @Inject() platformAppsService: PlatformAppsService;

  get pageSlot() {
    return EAppPageSlot.TopNav;
  }

  get poppedOut() {
    const app = this.platformAppsService.getApp(this.params.appId);

    return !!(app && app.poppedOutSlots.find(slot => slot === this.pageSlot));
  }
}
