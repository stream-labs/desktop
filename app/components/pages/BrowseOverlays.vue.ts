import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject, Service } from 'services';
import { NavigationService } from 'services/navigation';
import { SceneCollectionsService } from 'services/scene-collections';
import { OverlaysPersistenceService } from 'services/scene-collections/overlays';
import { ScenesService } from 'services/scenes';
import { WidgetsService } from 'services/widgets';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { JsonrpcService } from 'services/api/jsonrpc/jsonrpc';
import { MagicLinkService } from 'services/magic-link';
import urlLib from 'url';
import electron from 'electron';
import { $t, I18nService } from 'services/i18n';
import BrowserView from 'components/shared/BrowserView';
import { RestreamService } from 'services/restream';
import { GuestApiHandler } from 'util/guest-api-handler';
import { IDownloadProgress } from 'util/requests';
import remote from '@electron/remote';

@Component({ components: { BrowserView } })
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() navigationService: NavigationService;
  @Inject() overlaysPersistenceService: OverlaysPersistenceService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;
  @Inject() private magicLinkService: MagicLinkService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;
  @Inject() private restreamService: RestreamService;

  @Prop() params: {
    type?: 'overlay' | 'widget-theme';
    id?: string;
  };

  downloadInProgress = false;

  onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      installOverlay: this.installOverlay,
      installWidgets: this.installWidgets,
      eligibleToRestream: () => {
        // assume all users are eligible
        return Promise.resolve(true);
      },
    });

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      const protocol = urlLib.parse(url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        remote.shell.openExternal(url);
      }
    });
  }

  async installOverlay(
    url: string,
    name: string,
    progressCallback?: (progress: IDownloadProgress) => void,
    mergePlatform = false,
  ) {
    const host = new urlLib.URL(url).hostname;
    const trustedHosts = ['cdn.streamlabs.com'];

    if (!trustedHosts.includes(host)) {
      console.error(`Ignoring overlay install from untrusted host: ${host}`);
      return;
    }

    if (this.downloadInProgress) {
      console.error('Already installing a theme');
      return;
    }

    // Handle exclusive theme that requires enabling multistream first
    // User should be eligible to enable restream for this behavior to work.
    // If restream is already set up, then just install as normal.
    if (
      mergePlatform &&
      this.userService.state.auth?.platforms.facebook &&
      this.restreamService.views.canEnableRestream &&
      !this.restreamService.shouldGoLiveWithRestream
    ) {
      this.navigationService.navigate('PlatformMerge', {
        platform: 'facebook',
        overlayUrl: url,
        overlayName: name,
      });
    } else {
      this.downloadInProgress = true;
      try {
        const sub = this.sceneCollectionsService.downloadProgress.subscribe(progressCallback);
        await this.sceneCollectionsService.installOverlay(url, name);
        sub.unsubscribe();
        this.downloadInProgress = false;
        this.navigationService.navigate('Studio');
      } catch (e: unknown) {
        this.downloadInProgress = false;
        throw e;
      }
    }
  }

  async installWidgets(urls: string[], progressCallback?: (progress: IDownloadProgress) => void) {
    for (const url of urls) {
      const host = new urlLib.URL(url).hostname;
      const trustedHosts = ['cdn.streamlabs.com'];

      if (!trustedHosts.includes(host)) {
        console.error(`Ignoring widget install from untrusted host: ${host}`);
        return;
      }

      const path = await this.overlaysPersistenceService.downloadOverlay(url);
      await this.widgetsService.loadWidgetFile(path, this.scenesService.views.activeSceneId);
    }

    this.navigationService.navigate('Studio');

    this.notificationsService.push({
      type: ENotificationType.SUCCESS,
      lifeTime: 8000,
      showTime: false,
      message: $t('Widget Theme installed & activated. Click here to manage your Widget Profiles.'),
      action: this.jsonrpcService.createRequest(
        Service.getResourceId(this.magicLinkService),
        'openWidgetThemesMagicLink',
      ),
    });
  }

  get overlaysUrl() {
    return this.userService.overlaysUrl(this.params.type, this.params.id);
  }
}
