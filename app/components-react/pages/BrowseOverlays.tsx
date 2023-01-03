import React, { useState } from 'react';
import urlLib from 'url';
import electron from 'electron';
import { Service } from 'services';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import { IDownloadProgress } from 'util/requests';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';

export default function BrowseOverlays(p: {
  params: { type?: 'overlay' | 'widget-themes' | 'site-themes'; id?: string };
}) {
  const {
    UserService,
    SceneCollectionsService,
    NavigationService,
    OverlaysPersistenceService,
    WidgetsService,
    ScenesService,
    MagicLinkService,
    NotificationsService,
    JsonrpcService,
    RestreamService,
  } = Services;
  const [downloading, setDownloading] = useState(false);

  function onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      installOverlay,
      installWidgets,
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

  async function installOverlay(
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

    if (downloading) {
      console.error('Already installing a theme');
      return;
    }

    // Handle exclusive theme that requires enabling multistream first
    // User should be eligible to enable restream for this behavior to work.
    // If restream is already set up, then just install as normal.
    if (
      mergePlatform &&
      UserService.state.auth?.platforms.facebook &&
      RestreamService.views.canEnableRestream &&
      !RestreamService.shouldGoLiveWithRestream
    ) {
      NavigationService.actions.navigate('PlatformMerge', {
        platform: 'facebook',
        overlayUrl: url,
        overlayName: name,
      });
    } else {
      setDownloading(true);
      try {
        const sub = SceneCollectionsService.downloadProgress.subscribe(progressCallback);
        await SceneCollectionsService.actions.return.installOverlay(url, name);
        sub.unsubscribe();
        setDownloading(false);
        NavigationService.actions.navigate('Studio');
      } catch (e: unknown) {
        setDownloading(false);
        throw e;
      }
    }
  }

  async function installWidgets(urls: string[]) {
    for (const url of urls) {
      const host = new urlLib.URL(url).hostname;
      const trustedHosts = ['cdn.streamlabs.com'];

      if (!trustedHosts.includes(host)) {
        console.error(`Ignoring widget install from untrusted host: ${host}`);
        return;
      }

      const path = await OverlaysPersistenceService.actions.return.downloadOverlay(url);
      await WidgetsService.actions.return.loadWidgetFile(path, ScenesService.views.activeSceneId);
    }

    NavigationService.actions.navigate('Studio');

    NotificationsService.actions.push({
      type: ENotificationType.SUCCESS,
      lifeTime: 8000,
      showTime: false,
      message: $t('Widget Theme installed & activated. Click here to manage your Widget Profiles.'),
      action: JsonrpcService.createRequest(
        Service.getResourceId(MagicLinkService),
        'openWidgetThemesMagicLink',
      ),
    });
  }
  return (
    <BrowserView
      onReady={onBrowserViewReady}
      src={UserService.views.overlaysUrl(p.params?.type, p.params?.id)}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      enableGuestApi
      setLocale
    />
  );
}
