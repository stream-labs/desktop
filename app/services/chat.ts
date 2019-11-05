import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { getPlatformService } from 'services/platforms';
import { CustomizationService, ICustomizationSettings } from 'services/customization';
import electron from 'electron';
import { YoutubeService } from 'services/platforms/youtube';
import url from 'url';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { StreamInfoService } from './stream-info';
import { InitAfter } from './core';

@InitAfter('StreamInfoService')
export class ChatService extends Service {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() streamInfoService: StreamInfoService;

  private chatView: Electron.BrowserView;
  private chatUrl = '';
  private electronWindowId: number;

  init() {
    // listen `streamInfoChanged` to init or deinit the chat
    this.chatUrl = this.streamInfoService.state.chatUrl;
    this.streamInfoService.streamInfoChanged.subscribe(streamInfo => {
      if (streamInfo.chatUrl === void 0) return; // chatUrl has not been changed

      // chat url has been changed, set the new chat url
      const oldChatUrl = this.chatUrl;
      this.chatUrl = streamInfo.chatUrl;

      // chat url has been changed to an empty string, deinit chat
      if (oldChatUrl && !this.chatUrl) {
        this.deinitChat();
        return;
      }

      if (!this.chatUrl) return;

      // chat url changed to a new valid url, init or reload chat
      if (oldChatUrl) {
        this.deinitChat();
        this.initChat();
      } else {
        this.initChat();
      }
    });
  }

  refreshChat() {
    this.navigateToChat();
  }

  mountChat(electronWindowId: number) {
    this.electronWindowId = electronWindowId;
    if (!this.chatView) this.initChat();

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // This method was added in our fork
    (win as any).addBrowserView(this.chatView);
  }

  setChatBounds(position: IVec2, size: IVec2) {
    if (!this.chatView) return;

    this.chatView.setBounds({
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: Math.round(size.x),
      height: Math.round(size.y),
    });
  }

  unmountChat(electronWindowId: number) {
    this.electronWindowId = null;
    if (!this.chatView) return;

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // @ts-ignore: this method was added in our fork
    win.removeBrowserView(this.chatView);
  }

  private initChat() {
    if (this.chatView) return;

    const partition = this.userService.state.auth.partition;

    this.chatView = new electron.remote.BrowserView({
      webPreferences: {
        partition,
        nodeIntegration: false,
      },
    });

    this.navigateToChat();
    this.bindWindowListener();
    this.bindDomReadyListener();

    this.customizationService.settingsChanged.subscribe(changed => {
      this.handleSettingsChanged(changed);
    });
  }

  private deinitChat() {
    // @ts-ignore: typings are incorrect
    this.chatView.destroy();
    this.chatView = null;
  }

  private async navigateToChat() {
    const service = getPlatformService(this.userService.platform.type);

    // Youtube requires some special redirecting
    if (service instanceof YoutubeService) {
      this.chatView.webContents
        .loadURL('https://youtube.com/signin')
        .catch(this.handleRedirectError);

      this.chatView.webContents.once('did-navigate', () => {
        if (!this.chatUrl) return; // user has logged out
        this.chatView.webContents.loadURL(this.chatUrl).catch(this.handleRedirectError);
      });
    } else {
      if (!this.chatUrl) return; // user has logged out
      this.chatView.webContents.loadURL(this.chatUrl).catch(this.handleRedirectError);
    }

    // mount chat if electronWindowId is set and it has not been mounted yet
    if (this.electronWindowId) this.mountChat(this.electronWindowId);
  }

  handleRedirectError(e: Error) {
    // This error happens when the page redirects, which is expected for chat
    if (!e.message.match(/\(\-3\) loading/)) {
      throw e;
    }
  }

  private bindWindowListener() {
    electron.ipcRenderer.send('webContents-preventPopup', this.chatView.webContents.id);

    this.chatView.webContents.on('new-window', (evt, targetUrl) => {
      const parsedUrl = url.parse(targetUrl);
      const protocol = parsedUrl.protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        if (
          parsedUrl.host &&
          parsedUrl.query &&
          (parsedUrl.host === 'twitch.tv' || parsedUrl.host.endsWith('.twitch.tv')) &&
          parsedUrl.query.includes('ffz-settings')
        ) {
          this.windowsService.createOneOffWindow(
            {
              componentName: 'FFZSettings',
              title: $t('FrankerFaceZ Settings'),
              queryParams: {},
              size: {
                width: 800,
                height: 800,
              },
            },
            'ffz-settings',
          );
        } else {
          electron.remote.shell.openExternal(targetUrl);
        }
      }
    });
  }

  private bindDomReadyListener() {
    const settings = this.customizationService.getSettings();

    this.chatView.webContents.on('dom-ready', () => {
      this.chatView.webContents.setZoomFactor(settings.chatZoomFactor);

      if (settings.enableBTTVEmotes && this.userService.platform.type === 'twitch') {
        this.chatView.webContents.executeJavaScript(
          `
          localStorage.setItem('bttv_clickTwitchEmotes', true);
          localStorage.setItem('bttv_darkenedMode', ${
            this.customizationService.isDarkTheme ? 'true' : 'false'
          });

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
        `,
          true,
        );
      }

      if (settings.enableFFZEmotes && this.userService.platform.type === 'twitch') {
        this.chatView.webContents.executeJavaScript(
          `
          var ffzscript1 = document.createElement('script');
          ffzscript1.setAttribute('src','https://cdn.frankerfacez.com/script/script.min.js');
          document.head.appendChild(ffzscript1);
        `,
          true,
        );
      }
    });
  }

  private handleSettingsChanged(changed: Partial<ICustomizationSettings>) {
    if (!this.chatView) return;

    if (changed.chatZoomFactor) {
      this.chatView.webContents.setZoomFactor(changed.chatZoomFactor);
    }

    if (changed.enableBTTVEmotes != null || changed.enableFFZEmotes != null) {
      this.refreshChat();
    }
  }
}
