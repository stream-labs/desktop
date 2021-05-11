import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';

@Component({
  components: {
    ModalLayout,
  },
})
export default class FFZSettings extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;

  $refs: {
    ffzSettings: Electron.WebviewTag;
  };

  nightMode = false;

  mounted() {
    const webview = this.$refs.ffzSettings;
    const settings = this.customizationService.state;

    this.nightMode = this.customizationService.isDarkTheme;

    webview.addEventListener('dom-ready', () => {
      webview.setZoomFactor(settings.chatZoomFactor);

      webview.executeJavaScript(
        `
        var ffzscript1 = document.createElement('script');
        ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
        document.head.appendChild(ffzscript1);
        0;
      `,
        true,
      );
    });
  }

  get partition() {
    return this.userService.isLoggedIn ? this.userService.views.auth.partition : undefined;
  }

  get popoutURL() {
    return `https://www.twitch.tv/popout/frankerfacez/chat?ffz-settings${
      this.nightMode ? '&darkpopout' : ''
    }`;
  }
}
