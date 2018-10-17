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
}
