import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';

@Component({
  components: {
    ModalLayout
  }
})
export default class FFZSettings extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;

  $refs: {
    ffzSettings: Electron.WebviewTag
  }

  nightMode: Boolean = false;

  mounted() {
    const webview = this.$refs.ffzSettings;
    const settings = this.customizationService.getSettings();

    this.nightMode = settings.nightMode;

    webview.addEventListener('dom-ready', () => {
      webview.setZoomFactor(settings.chatZoomFactor);

      webview.executeJavaScript(`
        var ffzscript1 = document.createElement('script');
        ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
        document.head.appendChild(ffzscript1);
      `, true);
    })
  }

  get popoutURL() {
    return `https://www.twitch.tv/popout/frankerfacez/chat?ffz-settings${this.nightMode ? '&darkpopout' : ''}`
  }

  done() {
    this.windowsService.closeChildWindow();
  }
}