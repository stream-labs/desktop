import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { GuestApiService } from 'services/guest-api';
import { FacemasksService } from 'services/facemasks';
import { I18nService } from 'services/i18n';
import electron from 'electron';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() facemasksService: FacemasksService;
  @Inject() i18nService: I18nService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboard: Electron.WebviewTag;
  };

  mounted() {
    this.$refs.dashboard.addEventListener('dom-ready', () => {
      this.guestApiService.exposeApi(this.$refs.dashboard.getWebContents().id, {
        testAudio: this.testAudio,
        getStatus: this.getStatus,
        getDevices: this.getDevices,
        enableMask: this.enableMask,
        updateSettings: this.updateSettings,
        getDownloadProgress: this.getDownloadProgress
      });
    });

    this.i18nService.setWebviewLocale(this.$refs.dashboard);
    this.$refs.dashboard.addEventListener('new-window', e => {
      electron.remote.shell.openExternal(e.url);
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.dashboardUrl(this.params.subPage || '');
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
    return this.facemasksService.playTestAudio(volume);
  }
}
