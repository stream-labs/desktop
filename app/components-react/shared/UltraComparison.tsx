import React, { useEffect } from 'react';
import { $t } from 'services/i18n';
import styles from './UltraComparison.m.less';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import UltraIcon from 'components-react/shared/UltraIcon';
import { Tooltip } from 'antd';

interface IUltraComparisonProps {
  onSkip?: () => void;
  condensed?: boolean;
  featureData?: {
    standard: { text: string; icon?: string }[];
    ultra: { text: string; icon?: string }[];
  };
  refl: string;
}

export function UltraComparison(p: IUltraComparisonProps) {
  const { MagicLinkService, UserService } = Services;

  const featureData = p.featureData || {
    standard: [
      { icon: 'icon-broadcast', text: $t('Go live to one platform') },
      { icon: 'icon-balance', text: $t('Tipping (no Streamlabs fee)') },
      { icon: 'icon-widgets', text: $t('Alerts & other Widgets') },
      { icon: 'icon-record', text: $t('Recording') },
      { icon: 'icon-smart-record', text: $t('Selective Recording') },
      { icon: 'icon-editor-3', text: $t('Game Overlay') },
      { icon: 'icon-dual-output', text: $t('Dual Output (1 platform + TikTok)') },
      { text: $t('And many more free features') },
    ],
    ultra: [
      { icon: 'icon-streamlabs', text: $t('All free features') },
      { icon: 'icon-multistream', text: $t('Multistream to multiple platforms') },
      { icon: 'icon-design', text: $t('Premium Stream Overlays') },
      { icon: 'icon-themes', text: $t('Alert Box & Widget Themes') },
      { icon: 'icon-store', text: $t('Access all App Store Apps') },
      { icon: 'icon-dual-output', text: $t('Dual Output (3+ destinations)') },
      { icon: 'icon-team', text: $t('Collab Cam up to 11 guests') },
      { icon: 'icon-ultra', text: $t('Pro tier across the rest of the suite') },
      { text: $t('And many more Ultra features') },
    ],
  };

  useEffect(UserService.actions.setDisplayUltraPrices, []);

  function linkToPrime() {
    MagicLinkService.actions.linkToPrime(p.refl);
  }

  const ultraDisplayPrices = UserService.views.ultraDisplayPrices;

  if (!ultraDisplayPrices) {
    return null;
  }

  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: ultraDisplayPrices.currency,
    maximumFractionDigits: 0,
    // @ts-ignore: this exists
    roundingMode: 'floor',
  });
  const monthlyPrice = formatter.format(ultraDisplayPrices.monthlyPriceInCents / 100);
  const yearlyPrice = formatter.format(ultraDisplayPrices.yearlyPriceInCents / 100);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        fontSize: p.condensed ? '10px' : undefined,
      }}
    >
      <div
        className={cx(styles.cardContainer, { [styles.condensed]: p.condensed })}
        onClick={p.onSkip}
      >
        <div className={styles.header}>
          <h1>
            <i className="icon-streamlabs" />
            {$t('Free')}
          </h1>
          <div className={styles.subheader}>
            <span>{$t('Everything you need to go live.')}</span>
            <span>{$t('Always and forever free')}</span>
          </div>
          <div className={styles.button} data-testid="choose-free-plan-btn">
            {$t('Choose Free')}
          </div>
          <div className={styles.features}>
            {featureData.standard.map(data => (
              <div key={data.text} className={styles.row}>
                {data.icon && <i className={data.icon} />}
                <span>{data.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className={cx(styles.cardContainer, styles.primeCardContainer, {
          [styles.condensed]: p.condensed,
        })}
        onClick={linkToPrime}
      >
        <div className={styles.primeBacking} />
        <div className={styles.header}>
          <h1>
            <UltraIcon type="night" style={{ marginRight: '5px' }} />
            Streamlabs Ultra
          </h1>
          <div className={styles.subheader}>
            <span>{$t('Premium features for your stream.')}</span>
            <span>
              {$t('%{monthlyPrice}/mo or %{yearlyPrice}/year', {
                monthlyPrice,
                yearlyPrice,
              })}
            </span>
          </div>
          <div
            className={cx(styles.button, styles.primeButton)}
            data-testid="choose-ultra-plan-btn"
          >
            {$t('Choose Ultra')}
          </div>
        </div>
        <div className={styles.features}>
          {featureData.ultra.map(data => (
            <div className={styles.row} key={data.text}>
              {data.icon && <i className={data.icon} />}
              <span>{data.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
