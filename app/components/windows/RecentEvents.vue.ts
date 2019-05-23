import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { I18nService } from 'services/i18n';
import electron from 'electron';

@Component({
  components: { ModalLayout },
})
export default class RecentEvents extends Vue {
  @Inject() userService: UserService;
  @Inject() i18nService: I18nService;

  $refs: {
    webview: Electron.WebviewTag;
  };

  mounted() {
    I18nService.setWebviewLocale(this.$refs.webview);

    this.$refs.webview.addEventListener('new-window', e => {
      electron.remote.shell.openExternal(e.url);
    });
  }

  get recentEventsUrl() {
    return this.userService.recentEventsUrl();
  }
}
