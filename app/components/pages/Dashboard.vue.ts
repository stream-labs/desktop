import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { GuestApiService } from 'services/guest-api';
import electron from 'electron';
import { NavigationService, TAppPage } from 'services/navigation';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
  @Inject() navigationService: NavigationService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboard: Electron.WebviewTag;
  };

  mounted() {
    this.$refs.dashboard.addEventListener('did-finish-load', () => {
      this.guestApiService.exposeApi(this.$refs.dashboard.getWebContents().id, {
        navigate: this.navigate,
      });
    });

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

  async navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }
}
