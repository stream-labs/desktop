import { useModule } from 'components-react/hooks/useModule';
import React, { useEffect, useRef } from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import { OnboardingModule } from './Onboarding';
import styles from './Prime.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useWatchVuex } from 'components-react/hooks';

export function Prime() {
  const { MagicLinkService, UserService } = Services;
  const { next } = useModule(OnboardingModule).select();
  const primeMetadata = {
    standard: [
      { text: $t('Go live to one platform'), icon: 'icon-broadcast' },
      { text: $t('Tipping (no Streamlabs fee)'), icon: 'icon-balance' },
      { text: $t('Alerts & other Widgets'), icon: 'icon-widgets' },
      { text: $t('Recording'), icon: 'icon-record' },
      { text: $t('Selective Recording'), icon: 'icon-smart-record' },
      { text: $t('Game Overlay'), icon: 'icon-editor-7' },
      { text: $t('And many more free features'), icon: 'icon-more' },
    ],
    prime: [
      { text: $t('All free features'), icon: 'icon-streamlabs' },
      { text: $t('Multistream to multiple platforms'), icon: 'icon-multistream' },
      { text: $t('Premium Stream Overlays'), icon: 'icon-design' },
      { text: $t('Alert Box and Widget Themes'), icon: 'icon-themes' },
      { text: $t('Access to all App Store Apps'), icon: 'icon-store' },
      { text: $t('Prime Mobile Streaming'), icon: 'icon-phone' },
      { text: $t('Prime Web Suite'), icon: 'icon-desktop' },
    ],
  };

  useWatchVuex(
    () => UserService.views.isPrime,
    isPrime => isPrime && next(),
  );

  function linkToPrime() {
    MagicLinkService.actions.linkToPrime('slobs-onboarding');
  }

  return (
    <div style={{ width: '100%' }}>
      <h1 className={commonStyles.titleContainer}>{$t('Choose your Streamlabs plan')}</h1>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.cardContainer} onClick={next}>
          <h1>
            <i className="icon-streamlabs" />
            {$t('Free')}
          </h1>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {$t('Everything you need to go live. Always and forever free.')}
          </span>
          {primeMetadata.standard.map(data => (
            <div className={styles.primeRow} key={data.text}>
              <i className={data.icon} />
              <span>{data.text}</span>
            </div>
          ))}
          <div className={cx(styles.primeButton, styles.freeButton)}>{$t('Choose Free')}</div>
        </div>
        <div className={cx(styles.cardContainer, styles.primeCardContainer)} onClick={linkToPrime}>
          <h1>
            <i className="icon-prime" />
            {$t('Prime')}
          </h1>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {$t('Pro features to take your stream and channel to the next level.')}
          </span>
          {primeMetadata.prime.map(data => (
            <div className={styles.primeRow} key={data.text}>
              <i className={data.icon} />
              <span>{data.text}</span>
            </div>
          ))}
          <div className={styles.primeButton}>{$t('Choose Prime')}</div>
        </div>
      </div>
    </div>
  );
}
