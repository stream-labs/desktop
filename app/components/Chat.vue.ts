import Vue from 'vue';
import { Subscription } from 'rxjs/Subscription';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { getPlatformService } from 'services/platforms';
import { CustomizationService } from 'services/customization';
import { $t } from 'services/i18n';
import url from 'url';
import electron from 'electron';
import { ICustomizationSettings } from 'services/customization/customization-api';
import { YoutubeService } from 'services/platforms/youtube';
import { WindowsService } from 'services/windows';

@Component({})
export default class Chat extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;

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
      const parsedUrl = url.parse(e.url);
      const protocol = parsedUrl.protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        if (
          parsedUrl.host &&
          parsedUrl.query &&
          (parsedUrl.host === 'twitch.tv' || parsedUrl.host.endsWith('.twitch.tv')) &&
          parsedUrl.query.includes('ffz-settings')
        ) {
          this.windowsService.createOneOffWindow({
            componentName: 'FFZSettings',
            title: $t('FrankerFaceZ Settings'),
            queryParams: {},
            size: {
              width: 800,
              height: 800
            }
          }, 'ffz-settings');
        } else {
          electron.remote.shell.openExternal(e.url);
        }
      }
    });

    webview.addEventListener('dom-ready', () => {
      webview.setZoomFactor(settings.chatZoomFactor);

      if (settings.enableBTTVEmotes && this.isTwitch) {
        webview.executeJavaScript(`
          localStorage.setItem('bttv_clickTwitchEmotes', true);
          localStorage.setItem('bttv_darkenedMode', ${ settings.nightMode ? 'true' : 'false' });

          var bttvscript = document.createElement('script');
          bttvscript.setAttribute('src','https://cdn.betterttv.net/betterttv.js');
          document.head.appendChild(bttvscript);

          function loadLazyEmotes() {
            var els = document.getElementsByClassName('lazy-emote');

            Array.prototype.forEach.call(els, el => {
              const src = el.getAttribute('data-src');
              if (el.src !== 'https:' + src) el.src = src;
            });

            setTimeout(loadLazyEmotes, 1000);
          }

          loadLazyEmotes();
        `, true);
      }
      if (settings.enableFFZEmotes && this.isTwitch) {
        webview.executeJavaScript(`
          var ffzscript1 = document.createElement('script');
          ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
          document.head.appendChild(ffzscript1);
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
    this.$refs.chat.loadURL(this.chatUrl);
  }

  private onSettingsChangedHandler(changedSettings: Partial<ICustomizationSettings>) {
    if (changedSettings.chatZoomFactor) {
      this.$refs.chat.setZoomFactor(changedSettings.chatZoomFactor);
    }

    if (changedSettings.enableBTTVEmotes !== void 0) {
      this.refresh();
    }
    if (changedSettings.enableFFZEmotes !== void 0) {
      this.refresh();
    }
  }

}
