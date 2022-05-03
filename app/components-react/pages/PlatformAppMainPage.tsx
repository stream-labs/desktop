import React from 'react';
import { EAppPageSlot } from 'services/platform-apps';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import PlatformAppPageView from 'components-react/shared/PlatformAppPageView';

export default function PlatformAppMainPage(p: { params: { appId: string } }) {
  const { PlatformAppsService } = Services;
  const pageSlot = EAppPageSlot.TopNav;

  const app = PlatformAppsService.views.getApp(p.params.appId);
  const poppedOut = !!app?.poppedOutSlots.find(slot => slot === pageSlot);

  return (
    <div>
      {poppedOut ? (
        $t('This app is currently popped out in another window.')
      ) : (
        <PlatformAppPageView appId={p.params.appId} pageSlot={pageSlot} key={p.params.appId} />
      )}
    </div>
  );
}
