import React from 'react';
import urlLib from 'url';
import electron from 'electron';
import * as remote from '@electron/remote';
import { Service } from 'services';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import { IDownloadProgress } from 'util/requests';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

export default function AlertboxLibrary(p: { params: { id?: string } }) {
  const {
    NotificationsService,
    JsonrpcService,
    UserService,
    NavigationService,
    OverlaysPersistenceService,
    WidgetsService,
    ScenesService,
    MagicLinkService,
  } = Services;

  const { libraryUrl } = useVuex(() => ({
    libraryUrl: UserService.views.alertboxLibraryUrl(p.params?.id),
  }));

  function onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      installWidgets,
    });

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      const protocol = urlLib.parse(url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        remote.shell.openExternal(url);
      }
    });
  }

  async function installWidgets(
    urls: string[],
    progressCallback?: (progress: IDownloadProgress) => void,
  ) {
    for (const url of urls) {
      const host = new urlLib.URL(url).hostname;
      const trustedHosts = ['cdn.streamlabs.com'];

      if (!trustedHosts.includes(host)) {
        console.error(`Ignoring widget install from untrusted host: ${host}`);
        return;
      }

      const path = await OverlaysPersistenceService.downloadOverlay(url, progressCallback);
      await WidgetsService.loadWidgetFile(path, ScenesService.views.activeSceneId);
    }

    NavigationService.actions.navigate('Studio');

    NotificationsService.actions.push({
      type: ENotificationType.SUCCESS,
      lifeTime: 8000,
      showTime: false,
      message: $t(
        'Alertbox Theme installed & activated. Click here to manage your Widget Profiles.',
      ),
      action: JsonrpcService.createRequest(
        Service.getResourceId(MagicLinkService),
        'openWidgetThemesMagicLink',
      ),
    });
  }

  return (
    <BrowserView
      style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
      src={libraryUrl}
      enableGuestApi
      setLocale
      onReady={onBrowserViewReady}
    />
  );
}
