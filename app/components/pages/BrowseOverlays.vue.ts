import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject, Service } from 'services';
import { GuestApiService } from 'services/guest-api';
import { NavigationService } from 'services/navigation';
import { SceneCollectionsService } from 'services/scene-collections';
import { IDownloadProgress, OverlaysPersistenceService } from 'services/scene-collections/overlays';
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

@Component({ components: { BrowserView } })
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;
  @Inject() guestApiService: GuestApiService;
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

  onBrowserViewReady(view: Electron.BrowserView) {
    view.webContents.on('did-finish-load', () => {
      this.guestApiService.exposeApi(view.webContents.id, {
        installOverlay: this.installOverlay,
        installWidgets: this.installWidgets,
        eligibleToRestream: () => {
          if (!this.restreamService.canEnableRestream) {
            // We raise an exception which will result in a rejected promise.
            // This allows the themes library to catch out of date versions
            // in the same code path as ineligable users.
            throw new Error('User is not elgigible to restream');
          }

          return Promise.resolve(true);
        },
      });
    });

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      const protocol = urlLib.parse(url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        electron.remote.shell.openExternal(url);
      }
    });
  }

  async installOverlay(
    url: string,
    name: string,
    progressCallback?: (progress: IDownloadProgress) => void,
    mergeFacebook = false,
  ) {
    const host = new urlLib.URL(url).hostname;
    const trustedHosts = ['cdn.streamlabs.com'];

    if (!trustedHosts.includes(host)) {
      console.error(`Ignoring overlay install from untrusted host: ${host}`);
      return;
    }

    // Handle exclusive theme that requires enabling multistream first
    // User should be eligible to enable restream for this behavior to work.
    // If restream is already set up, then just install as normal.
    if (
      mergeFacebook &&
      this.restreamService.canEnableRestream &&
      !this.restreamService.shouldGoLiveWithRestream
    ) {
      this.navigationService.navigate('FacebookMerge', { overlayUrl: url, overlayName: name });
    } else {
      await this.sceneCollectionsService.installOverlay(url, name, progressCallback);
      this.navigationService.navigate('Studio');
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

      const path = await this.overlaysPersistenceService.downloadOverlay(url, progressCallback);
      await this.widgetsService.loadWidgetFile(path, this.scenesService.activeSceneId);
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
