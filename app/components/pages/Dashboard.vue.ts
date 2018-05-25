import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { GuestApiService } from 'services/guest-api';
import { FacemasksService } from 'services/facemasks';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() facemasksService: FacemasksService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboardWebview: Electron.WebviewTag;
  };

  mounted() {
    this.guestApiService.exposeApi(this.$refs.dashboardWebview, {
      log: this.log,
      getStatus: this.getStatus,
      getDevices: this.getDevices,
      enableMask: this.enableMask,
      updateSettings: this.updateSettings,
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.dashboardUrl(this.params.subPage || '');
  }

  async getStatus() {
    return this.facemasksService.getStatus();
  }

  async getDevices() {
    return this.facemasksService.getInputDevicesList();
  }

  async enabledDevices() {
    return this.facemasksService.getEnabledDevices();
  }

  async enableMask(uuid:string) {
    return this.facemasksService.enableMask(uuid);
  }

  async updateSettings(settings:any) {
    return this.facemasksService.updateSettings(settings);
  }

  async log(obj:any) {
    console.log(obj);
  }
}
