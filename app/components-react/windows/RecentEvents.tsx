import React from 'react';
import * as remote from '@electron/remote';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import BrowserView from 'components-react/shared/BrowserView';
import { Services } from 'components-react/service-provider';

export default function RecentEvents() {
  const { UserService } = Services;

  function onBrowserViewReady(view: Electron.BrowserView) {
    view.webContents.setWindowOpenHandler(details => {
      remote.shell.openExternal(details.url);

      return { action: 'deny' };
    });
  }

  return (
    <ModalLayout hideFooter>
      <BrowserView
        style={{ height: '100%', width: '100%' }}
        src={UserService.recentEventsUrl()}
        onReady={onBrowserViewReady}
        setLocale
      />
    </ModalLayout>
  );
}
