import React from 'react';
import Utils from 'services/utils';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';

export default function PlatformAppStore(p: { params: { appId?: string } }) {
  const { UserService, PlatformAppsService, PlatformAppStoreService, NavigationService } = Services;

  function onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      reloadProductionApps,
      openLinkInBrowser,
      onPaypalAuthSuccess,
      navigateToApp,
    });

    view.webContents.on('did-finish-load', () => {
      if (Utils.isDevMode()) {
        view.webContents.openDevTools();
      }
    });
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

  return (
    <BrowserView
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      src={UserService.views.appStoreUrl(p.params?.appId)}
      onReady={onBrowserViewReady}
      enableGuestApi
    />
  );
}
