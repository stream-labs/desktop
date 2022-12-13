import React from 'react';
import { $t } from 'services/i18n';
import styles from './UltraComparison.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';

interface IUltraComparisonProps {
  onSkip?: () => void;
  condensed?: boolean;
  refl: string;
}

export function UltraComparison(p: IUltraComparisonProps) {
  const { MagicLinkService } = Services;
  const tableHeaders = [
    { text: $t('Themes and Overlays'), icon: 'icon-themes' },
    { text: $t('Alerts and Widgets'), icon: 'icon-alert-box' },
    { text: $t('Streamlabs Desktop'), icon: 'icon-desktop' },
    { text: $t('Multistream'), icon: 'icon-multistream' },
    { text: $t('Collab Cam'), icon: 'icon-team-2' },
    { text: $t('Desktop App Store'), icon: 'icon-store' },
    { text: $t('Tips'), icon: 'icon-donation-settings' },
    { text: $t('Storage'), icon: 'icon-cloud-backup' },
    { text: $t('Cloudbot'), icon: 'icon-cloudbot' },
    {
      text: $t('All Streamlabs Pro Tools'),
      icon: 'icon-streamlabs',
      whisper: $t('Console, Crossclip, Oslo, Willow & Melon'),
    },
  ];
  const primeMetadata = {
    standard: [
      { text: $t('Access to Free Overlays and Themes') },
      { text: '✓', key: 'check1' },
      { text: '✓', key: 'check2' },
      { text: '—' },
      { text: $t('Add 1 Guest') },
      { text: $t('Limited Free Apps') },
      { text: $t('No-fee Tipping') },
      { text: '1GB' },
      { text: $t('Basic Chatbot') },
      { text: $t('Basic Features') },
    ],
    prime: [
      {
        text: p.condensed
          ? $t('Access to All Overlays and Themes')
          : $t('Access to All Overlays and Themes (%{themeNumber})', { themeNumber: '1000+' }),
      },
      { text: '✓', key: 'check1' },
      { text: '✓', key: 'check2' },
      { text: '✓', key: 'check3' },
      { text: $t('Add Up To 4 Guests or Cameras') },
      { text: $t('Access Full App Library (%{appNumber})', { appNumber: '60+' }) },
      { text: $t('Custom Tip Page and Domain') },
      { text: '10GB' },
      { text: $t('Custom Named Chatbot') },
      { text: $t('Pro Upgrade') },
    ],
  };

  function linkToPrime() {
    MagicLinkService.actions.linkToPrime(p.refl);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: p.condensed ? '10px' : undefined,
      }}
    >
      <div className={cx(styles.headersContainer, { [styles.condensed]: p.condensed })}>
        {tableHeaders.map(header => (
          <div className={styles.tableHeader} key={header.text}>
            <i className={header.icon} />
            <span>{header.text}</span>
            {header.whisper && <div className={styles.whisper}>{header.whisper}</div>}
          </div>
        ))}
      </div>
      <div
        className={cx(styles.cardContainer, { [styles.condensed]: p.condensed })}
        onClick={p.onSkip}
      >
        <div className={styles.header}>
          <h1>
            <i className="icon-streamlabs" />
            {$t('Starter')}
          </h1>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {p.condensed
              ? $t('Always and forever free')
              : $t('Everything you need to go live. Always and forever free.')}
          </span>
        </div>
        {primeMetadata.standard.map(data => (
          <div className={styles.row} key={data.key || data.text}>
            <span>{data.text}</span>
          </div>
        ))}
        <div className={styles.button}>{$t('Current Plan')}</div>
      </div>
      <div
        className={cx(styles.cardContainer, styles.primeCardContainer, {
          [styles.condensed]: p.condensed,
        })}
        onClick={linkToPrime}
      >
        <div className={styles.primeBacking} />
        <div className={cx(styles.header, styles.primeHeader)}>
          <h1>
            <UltraIcon type="night" style={{ marginRight: '5px' }} />
            Ultra
          </h1>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {p.condensed
              ? $t('Everything in Starter plus:')
              : $t('Includes everything in Starter plus:')}
          </span>
        </div>
        {primeMetadata.prime.map(data => (
          <div className={cx(styles.row, styles.primeRow)} key={data.key || data.text}>
            <span>{data.text}</span>
          </div>
        ))}
        <div className={cx(styles.button, styles.primeButton)}>{$t('Choose Ultra')}</div>
      </div>
    </div>
  );
}
