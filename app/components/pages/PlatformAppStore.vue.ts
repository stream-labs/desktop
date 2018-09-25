import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { GuestApiService } from 'services/guest-api';
import { I18nService } from 'services/i18n';
import electron from 'electron';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';

@Component({})
export default class PlatformAppStore extends Vue {
  @Inject() userService: UserService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() guestApiService: GuestApiService;
  @Inject() i18nService: I18nService;

  $refs: {
    appStore: Electron.WebviewTag;
  };

  mounted() {
    this.$refs.appStore.addEventListener('dom-ready', () => {
      // if (this.platformAppsService.state.devMode) {
      //   this.$refs.appStore.openDevTools();
      // }
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get appStoreUrl() {
    return this.userService.appStoreUrl();
  }
}
