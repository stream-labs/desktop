import React from 'react';
import electron from 'electron';
import * as remote from '@electron/remote';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import BrowserView from 'components-react/shared/BrowserView';
import { Services } from 'components-react/service-provider';

export default function RecentEvents() {
  const { UserService } = Services;

  function onBrowserViewReady(view: Electron.BrowserView) {
    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      remote.shell.openExternal(url);
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
