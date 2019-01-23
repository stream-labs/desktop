import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { I18nService } from 'services/i18n';

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
  }

  get recentEventsUrl() {
    return this.userService.recentEventsUrl();
  }
}
