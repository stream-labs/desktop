import React, { useState, useEffect } from 'react';
import Utils from 'services/utils';
import urlLib from 'url';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';

export default function PlatformAppStore(p: {
  params: { appId?: string; type?: string };
  className?: string;
}) {
  const { UserService, PlatformAppsService, PlatformAppStoreService, NavigationService } = Services;
  const [platformAppsUrl, setPlatformAppsUrl] = useState('');

  useEffect(() => {
    async function getPlatformAppsUrl() {
      const url = await UserService.views.appStoreUrl(p.params);
      if (!url) return;
      setPlatformAppsUrl(url);
    }

    getPlatformAppsUrl();
  }, [p.params]);

  function onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      reloadProductionApps,
      openLinkInBrowser,
      onPaypalAuthSuccess,
      navigateToApp,
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

    // reload apps after uninstall
    view.webContents.session.webRequest.onCompleted(
      { urls: ['https://platform.streamlabs.com/api/v1/app/*/uninstall'] },
      () => Promise.resolve(() => PlatformAppsService.actions.refreshProductionApps()),
    );
  }

  async function onPaypalAuthSuccess(callback: Function) {
    PlatformAppStoreService.actions.bindsPaypalSuccessCallback(callback);
  }

  async function openLinkInBrowser(url: string) {
    remote.shell.openExternal(url);
  }

  async function reloadProductionApps() {
    PlatformAppsService.actions.loadProductionApps();
  }

  async function navigateToApp(appId: string) {
    NavigationService.actions.navigate('PlatformAppMainPage', { appId });
  }

  if (!platformAppsUrl) return <></>;
  return (
    <BrowserView
      className={p.className}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      src={platformAppsUrl}
      onReady={onBrowserViewReady}
      enableGuestApi
    />
  );
}
