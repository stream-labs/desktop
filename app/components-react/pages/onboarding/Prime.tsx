import { useModule } from 'slap';
import React from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import { OnboardingModule } from './Onboarding';
import styles from './Prime.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useWatchVuex } from 'components-react/hooks';

export function Prime() {
  const { MagicLinkService, UserService } = Services;
  const { next } = useModule(OnboardingModule);
  const tableHeaders = [
    { text: $t('Themes and Overlays'), icon: 'icon-themes' },
    { text: $t('Alerts and Widgets'), icon: 'icon-themes' },
    { text: $t('Streamlabs Desktop'), icon: 'icon-themes' },
    { text: $t('Multistream'), icon: 'icon-themes' },
    { text: $t('Collab Cam'), icon: 'icon-themes' },
    { text: $t('Desktop App Store'), icon: 'icon-themes' },
    { text: $t('Tips'), icon: 'icon-themes' },
    { text: $t('Storage'), icon: 'icon-themes' },
    { text: $t('Cloudbot'), icon: 'icon-themes' },
    {
      text: $t('All Streamlabs Pro Tools'),
      icon: 'icon-themes',
      whisper: $t('Console, Crossclip, Oslo, Willow & Melon'),
    },
  ];
  const primeMetadata = {
    standard: [
      { text: $t('Access to Free Overlays and Themes') },
      { text: 'check' },
      { text: 'check' },
      { text: 'dash' },
      { text: $t('Add 1 Guest') },
      { text: $t('Limited Free Apps') },
      { text: $t('No-fee Tipping') },
      { text: '1GB' },
      { text: $t('Basic Chatbot') },
      { text: $t('Basic Features') },
    ],
    prime: [
      { text: $t('Access to All Overlays and Themes (%{themeNumber})', { themeNumber: '1000+' }) },
      { text: 'check' },
      { text: 'check' },
      { text: 'check' },
      { text: $t('Add Up To 4 Guests or Cameras') },
      { text: $t('Access Full App Library (%{appNumber})', { appNumber: '60+' }) },
      { text: $t('Custom Tip Page and Domain') },
      { text: '10GB' },
      { text: $t('Custom Named Chatbot') },
      { text: $t('Pro Upgrade') },
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
        <div className={styles.headersContainer}>
          {tableHeaders.map(header => (
            <div className={styles.tableHeader} key={header.text}>
              <i className={header.icon} />
              <span>{header.text}</span>
              {header.whisper && <div className={styles.whisper}>{header.whisper}</div>}
            </div>
          ))}
        </div>
        <div className={styles.cardContainer} onClick={() => next()}>
          <div className={styles.header}>
            <h1>
              <i className="icon-streamlabs" />
              {$t('Starter')}
            </h1>
            <span style={{ marginBottom: 8, display: 'inline-block' }}>
              {$t('Everything you need to go live. Always and forever free.')}
            </span>
          </div>
          {primeMetadata.standard.map(data => (
            <div className={styles.row} key={data.text}>
              <span>{data.text}</span>
            </div>
          ))}
          <div className={styles.button}>{$t('Current Plan')}</div>
        </div>
        <div className={cx(styles.cardContainer, styles.primeCardContainer)} onClick={linkToPrime}>
          <div className={styles.primeBacking} />
          <div className={cx(styles.header, styles.primeHeader)}>
            <h1>
              <i className="icon-ultra" />
              ultra
            </h1>
            <span style={{ marginBottom: 8, display: 'inline-block' }}>
              {$t('Includes everything in Starter plus:')}
            </span>
          </div>
          {primeMetadata.prime.map(data => (
            <div className={cx(styles.row, styles.primeRow)} key={data.text}>
              <span>{data.text}</span>
            </div>
          ))}
          <div className={cx(styles.button, styles.primeButton)}>{$t('Choose Ultra')}</div>
        </div>
      </div>
    </div>
  );
}
