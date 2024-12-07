import React, { useState, useEffect, useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import BrowserView from 'components-react/shared/BrowserView';
import { ModalLayout } from '../shared/ModalLayout';
import { Alert } from 'antd';
import { $t } from 'services/i18n';

export default function AlertBoxPropertiesEmbed() {
  const onBrowserViewReady = (_view: Electron.BrowserView) => {
    //view.webContents.on('did-finish-load', () => {
    //  view.webContents.openDevTools();
    //});
  };
  const { HostsService, MagicLinkService } = Services;
  const alertBoxPropertiesUrl = `https://${HostsService.streamlabs}/dashboard/alertbox?desktop=true`;
  const [url, setUrl] = useState('');
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('on effect');
    MagicLinkService.actions.return
      .getMagicSessionUrl(alertBoxPropertiesUrl)
      .then(url => {
        console.log('setting url to ', url);
        if (url) {
          setUrl(url);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const Component = useMemo(() => {
    if (loading) {
      // Rely on child window loader
      return <></>;
    }
    return url ? (
      <BrowserView
        onReady={onBrowserViewReady}
        src={url}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        setLocale
      />
    ) : (
      <Alert message={$t('Error loading AlertBox properties')} type="error" />
    );
  }, [loading, url]);

  return (
    <ModalLayout bodyStyle={{ padding: '0px' }} hideFooter={true}>
      {Component}
    </ModalLayout>
  );
}
