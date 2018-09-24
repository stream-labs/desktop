import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { GuestApiService } from 'services/guest-api';
import { I18nService } from 'services/i18n';
import electron from 'electron';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() i18nService: I18nService;

  $refs: {
    appStore: Electron.WebviewTag;
  };

  mounted() {
    this.$refs.appStore.addEventListener('dom-ready', () => {
      // do something?
    });

    this.i18nService.setWebviewLocale(this.$refs.appStore);
    this.$refs.appStore.addEventListener('new-window', e => {
      electron.remote.shell.openExternal(e.url);
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get appStoreUrl() {
    return `https://platform.streamlabs.com/slobs-store?token=${this.userService.apiToken}`
  }
}
