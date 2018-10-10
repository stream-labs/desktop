import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import PlatformAppWebview from 'components/PlatformAppWebview.vue';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import Util from 'services/utils';
import ModalLayout from 'components/ModalLayout.vue';
import { PlatformAppsService } from 'services/platform-apps';

@Component({
  components: { PlatformAppWebview, ModalLayout }
})
export default class PlatformAppPopOut extends Vue {

  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;

  get title() {
    const app = this.platformAppsService.getApp(this.params.appId);
    return app ? app.manifest.name : '';
  }

  get params() {
    const windowId = Util.getCurrentUrlParams().windowId;
    return this.windowsService.getWindowOptions(windowId);
  }

  get appId() {
    return this.params.appId;
  }

  get pageSlot() {
    return this.params.pageSlot;
  }

}
