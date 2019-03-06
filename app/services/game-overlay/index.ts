import overlay, { OverlayId } from '@streamlabs/game-overlay';
import electron from 'electron';
import { Subject, Subscription } from 'rxjs';
import { delay, take } from 'rxjs/operators';
import { Inject } from 'util/injector';
import { InitAfter } from 'util/service-observer';
import { Service } from '../service';
import { UserService } from 'services/user';
import { CustomizationService } from 'services/customization';
import { getPlatformService } from '../platforms';

const { BrowserWindow, BrowserView } = electron.remote;

@InitAfter('UserService')
export class GameOverlayService extends Service {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  overlayId: OverlayId;
  userLoginSubscription: Subscription;
  userLogoutSubscription: Subscription;
  windows: Dictionary<Electron.BrowserWindow> = {};
  onWindowsReady: Subject<string> = new Subject<string>();

  init() {
    console.log('initializing overlays');
    super.init();

    this.onWindowsReady
      .pipe(
        take(2),
        delay(10000),
      )
      .subscribe(() => {
        Object.values(this.windows).forEach(win => {
          win.show();
          overlay.addHWND(win.getNativeWindowHandle());
        });
        overlay.show();
      });

    if (this.userService.isLoggedIn()) {
      this.createOverlay();
    }
  }

  async createOverlay() {
    overlay.start();

    const commonWindowOptions = {
      show: false,
      frame: false,
      width: 300,
      height: 300,
      skipTaskbar: true,
      thickFrame: false,
    };

    this.windows.recentEvents = new BrowserWindow({
      ...commonWindowOptions,
      x: 20,
      y: 20,
    });

    this.windows.chat = new BrowserWindow({
      ...commonWindowOptions,
      x: 20,
      y: 320,
    });

    const recentEventsBrowserView = new BrowserView();
    const chatBrowserView = new BrowserView();

    recentEventsBrowserView.webContents.once('did-finish-load', () => {
      this.onWindowsReady.next('recentEvents');
    });

    chatBrowserView.webContents.once('did-finish-load', () => this.onWindowsReady.next('chat'));

    recentEventsBrowserView.setBounds({ x: 0, y: 0, width: 300, height: 300 });
    chatBrowserView.setBounds({ x: 0, y: 0, width: 300, height: 300 });

    recentEventsBrowserView.webContents.loadURL(this.userService.recentEventsUrl());
    chatBrowserView.webContents.loadURL(
      await getPlatformService(this.userService.platform.type).getChatUrl(
        this.customizationService.nightMode ? 'night' : 'day',
      ),
    );
    // @ts-ignore: this is supported in our fork
    this.windows.recentEvents.addBrowserView(recentEventsBrowserView);
    // @ts-ignore
    this.windows.chat.addBrowserView(chatBrowserView);
  }

  // FIXME: this should also be invoked on destroy but we dont seem to have an opposite to mounted, init, etc
  destroyOverlay() {}

  reloadOverlay() {}
}
