import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { GuestApiService } from 'services/guest-api';
import { FacemasksService } from 'services/facemasks';
import { I18nService } from 'services/i18n';
import { NavigationService, TAppPage } from 'services/navigation';
import BrowserFrame from 'components/shared/BrowserFrame.vue';

@Component({
  components: {
    BrowserFrame,
  },
})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() facemasksService: FacemasksService;
  @Inject() navigationService: NavigationService;
  @Inject() i18nService: I18nService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboard: BrowserFrame;
  };

  mounted() {
    this.$refs.dashboard.onFinishLoad(this.onViewLoaded);
  }

  onViewLoaded() {
    this.guestApiService.exposeApi(this.$refs.dashboard.id, {
      testAudio: this.testAudio,
      getStatus: this.getStatus,
      getDevices: this.getDevices,
      enableMask: this.enableMask,
      updateSettings: this.updateSettings,
      getDownloadProgress: this.getDownloadProgress,
      navigate: this.navigate,
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.dashboardUrl(this.params.subPage || '');
  }

  get partition() {
    return this.userService.state.auth.partition;
  }

  async getStatus() {
    return this.facemasksService.getDeviceStatus();
  }

  async getDevices() {
    return this.facemasksService.getInputDevicesList();
  }

  async enabledDevice() {
    return this.facemasksService.getEnabledDevice();
  }

  async enableMask(uuid: string) {
    return this.facemasksService.enableMask(uuid);
  }

  async updateSettings() {
    return this.facemasksService.startup();
  }

  async getDownloadProgress() {
    return this.facemasksService.getDownloadProgress();
  }

  async testAudio(volume: number) {
    return;
  }

  async navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }
}
