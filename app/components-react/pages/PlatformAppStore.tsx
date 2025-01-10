import React, { useState, useEffect, useRef } from 'react';
import Utils from 'services/utils';
import urlLib from 'url';
import BrowserView from 'components-react/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import { Button } from 'antd';
import { EMenuItemKey } from 'services/side-nav';
import { $t } from 'services/i18n';

export default function PlatformAppStore(p: { params: { appId?: string; type?: string } }) {
  const {
    UserService,
    PlatformAppsService,
    PlatformAppStoreService,
    NavigationService,
    HighlighterService,
  } = Services;
  const [platformAppsUrl, setPlatformAppsUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const browser = useRef<any>(null);
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
    <>
      <BrowserView
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: `calc(100% - ${currentUrl.includes('installed-apps') ? '72' : '0'}px)`,
        }}
        src={platformAppsUrl}
        onReady={onBrowserViewReady}
        enableGuestApi
        emitUrlChange={url => {
          setCurrentUrl(url);
        }}
      />
      {currentUrl.includes('installed-apps') && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            position: 'absolute',
            bottom: 0,
            height: '72px',
            alignItems: 'center',
            padding: '8px',
          }}
        >
          <div>Other installed apps: </div>
          <div
            style={{
              borderRadius: 8,
              border: '1px solid #30383D',
              display: 'flex',
              gap: '16px',
              padding: '8px',
              paddingLeft: '16px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>AI Highlighter</h3>
              <p style={{ opacity: 0.3, margin: 0 }}>by Streamlabs</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                size="middle"
                type="default"
                onClick={() => {
                  HighlighterService.UNINSTALL_HIGHLIGHTER();
                }}
              >
                {$t('Uninstall')}
              </Button>

              <Button
                size="middle"
                type="primary"
                onClick={() => {
                  NavigationService.actions.navigate(
                    'Highlighter',
                    { view: 'settings' },
                    EMenuItemKey.Highlighter,
                  );
                }}
              >
                {$t('Open')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
