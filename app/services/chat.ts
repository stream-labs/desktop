import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { getPlatformService } from 'services/platforms';
import { CustomizationService, ICustomizationSettings } from 'services/customization';
import electron from 'electron';
import { YoutubeService } from 'services/platforms/youtube';
import url from 'url';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';

export class ChatService extends Service {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;

  private chatView: Electron.BrowserView;

  init() {
    this.userService.userLogin.subscribe(() => this.initChat());
    this.userService.userLogout.subscribe(() => this.deinitChat());

    if (this.userService.isLoggedIn()) this.initChat();
  }

  refreshChat() {
    this.navigateToChat();
  }

  mountChat(electronWindowId: number) {
    if (!this.chatView) return;

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
    if (!this.chatView) return;

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // @ts-ignore: this method was added in our fork
    win.removeBrowserView(this.chatView);
  }

  private initChat() {
    if (this.chatView) return;

    this.chatView = new electron.remote.BrowserView({
      webPreferences: {
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
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    // Youtube requires some special redirecting
    if (service instanceof YoutubeService) {
      const chatUrl = await service.getChatUrl(nightMode);
      this.chatView.webContents.loadURL('https://youtube.com/signin');

      this.chatView.webContents.once('did-navigate', () => {
        this.chatView.webContents.loadURL(chatUrl);
      });
    } else {
      const chatUrl = await service.getChatUrl(nightMode);
      this.chatView.webContents.loadURL(chatUrl);
    }
  }

  private bindWindowListener() {
    this.chatView.webContents.on('new-window', evt => {
      const parsedUrl = url.parse(evt['url']);
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
          electron.remote.shell.openExternal(evt['url']);
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
          localStorage.setItem('bttv_darkenedMode', ${settings.nightMode ? 'true' : 'false'});

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
