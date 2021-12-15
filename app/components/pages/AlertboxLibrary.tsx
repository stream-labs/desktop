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
import { BrowserView } from 'components/shared/ReactComponentList';
import { RestreamService } from 'services/restream';
import { GuestApiHandler } from 'util/guest-api-handler';
import TsxComponent, { createProps } from 'components/tsx-component';
import { IDownloadProgress } from 'util/requests';

class AlertboxLibraryProps {
  params: { id?: string } = {};
}

@Component({ props: createProps(AlertboxLibraryProps) })
export default class AlertboxLibrary extends TsxComponent<AlertboxLibraryProps> {
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

  onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      installWidgets: this.installWidgets,
    });

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      const protocol = urlLib.parse(url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        electron.remote.shell.openExternal(url);
      }
    });
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
      await this.widgetsService.loadWidgetFile(path, this.scenesService.views.activeSceneId);
    }

    this.navigationService.navigate('Studio');

    this.notificationsService.push({
      type: ENotificationType.SUCCESS,
      lifeTime: 8000,
      showTime: false,
      message: $t(
        'Alertbox Theme installed & activated. Click here to manage your Widget Profiles.',
      ),
      action: this.jsonrpcService.createRequest(
        Service.getResourceId(this.magicLinkService),
        'openWidgetThemesMagicLink',
      ),
    });
  }

  get libraryUrl() {
    return this.userService.alertboxLibraryUrl(this.props.params.id);
  }

  render() {
    return (
      <div>
        <BrowserView
          style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
          componentProps={{
            src: this.libraryUrl,
            enableGuestApi: true,
            setLocale: true,
            onReady: this.onBrowserViewReady.bind(this),
          }}
        />
      </div>
    );
  }
}
