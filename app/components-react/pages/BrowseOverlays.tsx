import React, { useState, useEffect } from 'react';
import urlLib from 'url';
import { Service } from 'services';
import Utils from 'services/utils';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import { IDownloadProgress } from 'util/requests';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';

export default function BrowseOverlays(p: {
  params: { type?: 'overlay' | 'widget-themes' | 'site-themes'; id?: string; install?: string };
  className?: string;
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
  const [overlaysUrl, setOverlaysUrl] = useState('');

  useEffect(() => {
    async function getOverlaysUrl() {
      const url = await UserService.actions.return.overlaysUrl(p.params?.type, p.params?.id, p.params?.install);
      if (!url) return;
      setOverlaysUrl(url);
    }

    getOverlaysUrl();
  }, [p.params?.type, p.params?.id, p.params?.install]);

  function onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      installOverlay,
      installWidgets,
      installOverlayAndWidgets,
      eligibleToRestream: () => {
        // assume all users are eligible
        return Promise.resolve(true);
      },
    });

    view.webContents.setWindowOpenHandler(details => {
      const protocol = urlLib.parse(details.url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        remote.shell.openExternal(details.url);
      }

      return { action: 'deny' };
    });

    view.webContents.on('did-finish-load', () => {
      if (Utils.isDevMode()) {
        view.webContents.openDevTools();
      }
    });
  }

  async function installOverlay(
    url: string,
    name: string,
    progressCallback?: (progress: IDownloadProgress) => void,
    mergePlatform = false,
  ) {
    try {
      await installOverlayBase(url, name, progressCallback, mergePlatform);
      NavigationService.actions.navigate('Studio');
    } catch(e) {
      // If the overlay requires platform merge, navigate to the platform merge page
      if (e.message === 'REQUIRES_PLATFORM_MERGE') {
        NavigationService.actions.navigate('PlatformMerge', { overlayUrl: url, overlayName: name });
      } else {
        console.error(e);
      }
    }
  }

  async function installOverlayBase(
    url: string,
    name: string,
    progressCallback?: (progress: IDownloadProgress) => void,
    mergePlatform = false
  ) {
    return new Promise<void>((resolve, reject) => {
      const host = new urlLib.URL(url).hostname;
      const trustedHosts = ['cdn.streamlabs.com'];
      if (!trustedHosts.includes(host)) {
        reject(new Error(`Ignoring overlay install from untrusted host: ${host}`));
      }

      if (downloading) {
        reject(new Error('Already installing a theme'));
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
        reject(new Error('REQUIRES_PLATFORM_MERGE'));
      } else {
        setDownloading(true);
        const sub = SceneCollectionsService.downloadProgress.subscribe(progressCallback);
        SceneCollectionsService.actions.return.installOverlay(url, name)
          .then(() => {
            sub.unsubscribe();
            setDownloading(false);
            resolve();
          })
          .catch((e: unknown) => {
            sub.unsubscribe();
            setDownloading(false);
            reject(e);
          });
      }
    });
  }

  async function installWidgets(urls: string[]) {
    await installWidgetsBase(urls);
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

  async function installWidgetsBase(urls: string[]) {
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
  }

  async function installOverlayAndWidgets(overlayUrl: string, overlayName: string, widgetUrls: string[]) {
    try {
      await installOverlayBase(overlayUrl, overlayName);
      await installWidgetsBase(widgetUrls);
      NavigationService.actions.navigate('Studio');
    } catch (e) {
      console.error(e);
    }
  }

  if (!overlaysUrl) return <></>;
  return (
    <BrowserView
      className={p.className}
      onReady={onBrowserViewReady}
      src={overlaysUrl}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      enableGuestApi
      setLocale
    />
  );
}
