import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import PlatformAppPageView from 'components/PlatformAppPageView.vue';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import Util from 'services/utils';
import ModalLayout from 'components/ModalLayout.vue';
import { PlatformAppsService } from 'services/platform-apps';
import { Subscription } from 'rxjs';

@Component({
  components: { PlatformAppPageView, ModalLayout },
})
export default class PlatformAppPopOut extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;
  unloadSub: Subscription;

  mounted() {
    this.platformAppsService.appUnload.subscribe(appId => {
      if (appId === this.params.appId) {
        this.windowsService.closeOneOffWindow(this.windowId);
      }
    });
  }

  get windowId() {
    return Util.getCurrentUrlParams().windowId;
  }

  get title() {
    const app = this.platformAppsService.getApp(this.params.appId);
    return app ? app.manifest.name : '';
  }

  get params() {
    return this.windowsService.getWindowOptions(this.windowId);
  }

  get appId() {
    return this.params.appId;
  }

  get pageSlot() {
    return this.params.pageSlot;
  }

  destroyed() {
    this.unloadSub.unsubscribe();
  }
}
