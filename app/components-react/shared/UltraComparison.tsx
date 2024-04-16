import React from 'react';
import { $t } from 'services/i18n';
import styles from './UltraComparison.module.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';
import { Tooltip } from 'antd';

interface ITableHeader {
  text: string;
  icon: string | JSX.Element;
  tooltip?: string;
  whisper?: string;
}

interface IUltraComparisonProps {
  onSkip?: () => void;
  condensed?: boolean;
  tableHeaders?: ITableHeader[];
  tableData?: {
    standard: { text: string; key?: string }[];
    prime: { text: string; key?: string }[];
  };
  refl: string;
}

export function UltraComparison(p: IUltraComparisonProps) {
  const { MagicLinkService } = Services;
  const tableHeaders = p.tableHeaders || [
    { text: $t('Streamlabs Desktop'), icon: 'icon-desktop' },
    { text: $t('Themes and Overlays'), icon: 'icon-themes' },
    { text: $t('Multistream'), icon: 'icon-multistream' },
    { text: $t('Dual Output'), icon: <DualOutputIcon /> },
    { text: $t('Seamless Creator Workflow'), icon: 'icon-user' },
    { text: $t('Desktop App Store'), icon: 'icon-store' },
    { text: $t('Collab Cam'), icon: 'icon-team-2' },
    { text: $t('Cloudbot'), icon: 'icon-cloudbot' },
    { text: $t('Alerts and Widgets'), icon: 'icon-alert-box' },
    { text: $t('Streamlabs Mobile'), icon: 'icon-phone' },
    { text: $t('Streamlabs Console'), icon: 'icon-console' },
    { text: $t('Tips'), icon: 'icon-donation-settings' },
    { text: $t('Storage'), icon: 'icon-cloud-backup' },
    {
      text: $t('All Streamlabs Pro Tools'),
      icon: 'icon-streamlabs',
      whisper: 'Cross Clip, Talk Studio, Video Editor, Podcast Editor',
    },
  ];
  const tableData = p.tableData || {
    standard: [
      { text: '✓', key: 'check1' },
      { text: $t('Access to Free Overlays and Themes') },
      { text: '—', key: 'dash1' },
      { text: $t('%{destinationsNumber} Destinations', { destinationsNumber: '2' }) },
      { text: '✓', key: 'check2' },
      { text: $t('Limited Free Apps') },
      { text: $t('Add 1 Guest') },
      { text: $t('Basic Chatbot') },
      { text: '✓', key: 'check3' },
      { text: '✓', key: 'check4' },
      { text: '—', key: 'dash2' },
      { text: $t('No-fee Tipping') },
      { text: '1GB' },
      { text: $t('Basic Features') },
    ],
    prime: [
      { text: '✓', key: 'check1' },
      {
        text: p.condensed
          ? $t('Access to All Overlays and Themes')
          : $t('Access to All Overlays and Themes (%{themeNumber})', { themeNumber: '1000+' }),
      },
      { text: '✓', key: 'check2' },
      { text: $t('%{destinationsNumber} Destinations', { destinationsNumber: '3+' }) },
      { text: '✓', key: 'check3' },
      { text: $t('Access Full App Library (%{appNumber})', { appNumber: '60+' }) },
      { text: $t('Add Up To 11 Guests or Cameras') },
      { text: $t('Custom Named Chatbot') },
      { text: '✓', key: 'check4' },
      { text: '✓  ' + $t('+ Disconnect Protection') },
      { text: '✓', key: 'check5' },
      { text: $t('Custom Tip Page and Domain') },
      { text: '10GB' },
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
      <div
        className={cx(styles.headersContainer, {
          [styles.condensed]: p.condensed,
          [styles.custom]: p.tableHeaders,
        })}
      >
        {tableHeaders.map(header => (
          <TableHeader header={header} key={header.text} />
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
          <h2>{$t('Free')}</h2>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {p.condensed
              ? $t('Always and forever free')
              : $t('Everything you need to go live. Always and forever free.')}
          </span>
          <div className={styles.button}>{$t('Choose Starter')}</div>
        </div>
        {tableData.standard.map(data => (
          <div className={styles.row} key={data.key || data.text}>
            <span>{data.text}</span>
          </div>
        ))}
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
          <h2>
            {$t('%{monthlyPrice}/mo or %{yearlyPrice}/year', {
              monthlyPrice: '$19',
              yearlyPrice: '$149',
            })}
          </h2>
          <span style={{ marginBottom: 8, display: 'inline-block' }}>
            {p.condensed
              ? $t('Everything in Starter plus:')
              : $t('Includes everything in Starter plus:')}
          </span>
          <div className={cx(styles.button, styles.primeButton)}>{$t('Choose Ultra')}</div>
        </div>
        {tableData.prime.map(data => (
          <div className={cx(styles.row, styles.primeRow)} key={data.key || data.text}>
            <span>{data.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableHeader(p: { header: ITableHeader }) {
  const cell = (
    <div className={styles.tableHeader} key={p.header.text}>
      {typeof p.header.icon === 'string' ? <i className={p.header.icon} /> : p.header.icon}
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          ...(typeof p.header.icon === 'string' ? {} : { marginLeft: 8 }),
        }}
      >
        {p.header.text}
        {p.header.whisper && <div className={styles.whisper}>{p.header.whisper}</div>}
      </span>
      {p.header.tooltip && <i className="icon-question" />}
    </div>
  );

  if (p.header.tooltip) {
    return (
      <Tooltip title={p.header.tooltip} placement="right">
        {cell}
      </Tooltip>
    );
  } else return cell;
}

const DualOutputIcon = ({ color = '#bdc2c4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 1C6 0.4 5.6 0 5 0H4H2H1C0.4 0 0 0.4 0 1V8C0 8.6 0.4 9 1 9H2V13C2 13.6 2.4 14 3 14H11C11.6 14 12 13.6 12 13V9H13C13.6 9 14 8.6 14 8V1C14 0.4 13.6 0 13 0H12H10H9C8.4 0 8 0.4 8 1V8C8 8.6 8.4 9 9 9H10V12H4V9H5C5.6 9 6 8.6 6 8V1Z"
      fill={color}
    />
  </svg>
);
