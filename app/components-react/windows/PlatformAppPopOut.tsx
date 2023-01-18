import React, { useEffect } from 'react';
import PlatformAppPageView from 'components-react/shared/PlatformAppPageView';
import Util from 'services/utils';
import { Services } from 'components-react/service-provider';

export default function PlatformAppPopOut() {
  const { WindowsService, PlatformAppsService } = Services;
  const windowId = Util.getCurrentUrlParams().windowId;
  const params = WindowsService.getWindowOptions(windowId);

  useEffect(() => {
    const subscription = PlatformAppsService.appUnload.subscribe(appId => {
      if (appId === params?.appId) {
        WindowsService.actions.closeOneOffWindow(windowId);
      }
    });

    return subscription.unsubscribe;
  }, []);

  return (
    <PlatformAppPageView
      appId={params.appId}
      pageSlot={params.pageSlot}
      style={{ height: 'calc(100% - 30px)', width: '100%' }}
    />
  );
}
