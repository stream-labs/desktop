import React from 'react';
import styles from './GoLive.m.less';
import InfoBanner from 'components-react/shared/InfoBanner';
import { EDismissable } from 'services/dismissables';
import Translate from 'components-react/shared/Translate';
import { $t } from '../../../services/i18n';
import * as remote from '@electron/remote';
import { Services } from '../../service-provider';

export function GoLiveBanner() {
  function openApplicationInfoPage() {
    remote.shell.openExternal(Services.TikTokService.applicationUrl);
    Services.DismissablesService.actions.dismiss(EDismissable.TikTokEligible);
    Services.UsageStatisticsService.recordAnalyticsEvent('TikTokApplyPrompt', {
      component: 'GoLiveWindowBanner',
    });
  }

  return (
    <div className={styles.bannerWrapper}>
      <InfoBanner
        message={
          <Translate
            message={$t('You may be eligible for TikTok Live Access. <apply>Apply here.</apply>')}
          >
            <u slot="apply" />
          </Translate>
        }
        type="info"
        className={styles.banner}
        onClick={openApplicationInfoPage}
        dismissableKey={EDismissable.TikTokEligible}
      />
    </div>
  );
}

export default GoLiveBanner;
