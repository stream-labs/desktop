import Vue from 'vue';
import { Subscription } from 'rxjs/Subscription';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { getPlatformService } from 'services/platforms';
import { CustomizationService } from 'services/customization';
import url from 'url';
import electron from 'electron';
import { ICustomizationSettings } from 'services/customization/customization-api';
import { YoutubeService } from 'services/platforms/youtube';

@Component({})
export default class Chat extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  chatUrl: string = '';

  $refs: {
    chat: Electron.WebviewTag;
  };

  private settingsSubscr: Subscription = null;

  mounted() {
    const platform = this.userService.platform.type;
    const service = getPlatformService(platform);
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';
    const webview = this.$refs.chat;
    const settings = this.customizationService.getSettings();

    if (service instanceof YoutubeService) {
      service.getChatUrl(nightMode).then(chatUrl => {
        this.chatUrl = 'https://youtube.com/signin';

        webview.addEventListener('did-navigate', () => {
          this.chatUrl = chatUrl;
        });
      });
    } else {
      service.getChatUrl(nightMode).then(chatUrl => this.chatUrl = chatUrl);
    }


    webview.addEventListener('new-window', e => {
      const protocol = url.parse(e.url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        electron.remote.shell.openExternal(e.url);
      }
    });

    webview.addEventListener('dom-ready', () => {
      webview.setZoomFactor(settings.chatZoomFactor);

      if (settings.enableBTTVEmotes && this.isTwitch) {
        webview.executeJavaScript(`
          
          localStorage.setItem('bttv_clickTwitchEmotes', true);
          localStorage.setItem('bttv_darkenedMode', ${ settings.nightMode ? 'true' : 'false' });
          
          var bbtvscript1 = document.createElement('script');
          bbtvscript1.setAttribute('src','https://cdn.betterttv.net/betterttv.js');
          document.head.appendChild(bbtvscript1);
          
          var bbtvscript2 = document.createElement('script');
          bbtvscript2.setAttribute('src','https://legacy.betterttv.net/betterttv.js');
          document.head.appendChild(bbtvscript2);
          
        `, true);
      }
    });

    this.settingsSubscr = this.customizationService.settingsChanged.subscribe(
      (changedSettings) => this.onSettingsChangedHandler(changedSettings)
    );
  }

  destroyed() {
    this.settingsSubscr.unsubscribe();
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  refresh() {
    this.$refs.chat.reload();
  }

  private onSettingsChangedHandler(changedSettings: Partial<ICustomizationSettings>) {
    if (changedSettings.chatZoomFactor) {
      this.$refs.chat.setZoomFactor(changedSettings.chatZoomFactor);
    }

    if (changedSettings.enableBTTVEmotes !== void 0) {
      this.refresh();
    }
  }

}
