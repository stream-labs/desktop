import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { I18nService } from 'services/i18n';

@Component({})
export default class Dashboard extends Vue {
  @Inject() userService: UserService;
  @Inject() i18nService: I18nService;
  @Prop() params: Dictionary<string>;

  $refs: {
    dashboard: Electron.WebviewTag;
  };

  mounted() {
    // setup language
    const webview = this.$refs.dashboard;
    const locale = this.i18nService.state.locale;
    webview.addEventListener('dom-ready', () => {
      webview.executeJavaScript(`
        var langCode = $.cookie('langCode');
        if (langCode !== '${locale}') {
           $.cookie('langCode', '${locale}');
           window.location.reload();
        }
      `);
    });
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.dashboardUrl(this.params.subPage || '');
  }
}
