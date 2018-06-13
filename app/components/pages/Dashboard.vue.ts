import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { I18nService } from 'services/i18n';
import electron from 'electron';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() i18nService: I18nService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboard: Electron.WebviewTag;
  };

  mounted() {
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
}
