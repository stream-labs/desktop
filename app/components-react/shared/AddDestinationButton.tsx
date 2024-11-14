import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import { Button } from 'antd';
import { ButtonGroup } from 'components-react/shared/ButtonGroup';
import UltraIcon from './UltraIcon';
import ButtonHighlighted from './ButtonHighlighted';
import styles from './AddDestinationButton.m.less';
import cx from 'classnames';
interface IAddDestinationButtonProps {
  type?: 'default' | 'ultra';
  text?: string;
  className?: string;
  style?: CSSProperties;
}

export default function AddDestinationButton(p: IAddDestinationButtonProps) {
  const {
    addDestination,
    shouldShowPrimeLabel,
    isDualOutputMode,
    isPrime,
  } = useGoLiveSettings().extend(module => {
    const {
      RestreamService,
      SettingsService,
      MagicLinkService,
      UserService,
      UsageStatisticsService,
      WebsocketService,
    } = Services;

    return {
      addDestination() {
        // open the stream settings or prime page
        if (UserService.views.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else if (isDualOutputMode) {
          // record dual output analytics event
          const ultraSubscription = WebsocketService.ultraSubscription.subscribe(() => {
            UsageStatisticsService.recordAnalyticsEvent('DualOutput', {
              type: 'UpgradeToUltra',
            });
            ultraSubscription.unsubscribe();
          });
          MagicLinkService.linkToPrime('slobs-multistream');
        } else {
          MagicLinkService.linkToPrime('slobs-multistream');
        }
      },

      shouldShowPrimeLabel:
        p.type === 'ultra' || (!RestreamService.state.grandfathered && !module.isPrime),
    };
  });

  return (
    <ButtonGroup
      className={cx(styles.addDestinationGroup, {
        [styles.ultraBtnGroup]: !isPrime,
      })}
      align="center"
      direction="vertical"
      size="middle"
      style={p?.style}
    >
      {shouldShowPrimeLabel && (
        <ButtonHighlighted
          faded
          className={cx(styles.addDestinationBtn, p.className, styles.ultraBtn)}
          onClick={addDestination}
        >
          <div className={styles.btnText}>
            <i className={cx('icon-add', styles.addDestinationIcon)} />
            {$t('Add Destination with Ultra')}
          </div>
          <UltraIcon type="night" className={styles.ultraIcon} />
        </ButtonHighlighted>
      )}
      {!shouldShowPrimeLabel && (
        <Button
          className={cx(styles.addDestinationBtn, styles.default, p.className)}
          onClick={addDestination}
          block
        >
          <div className={styles.btnText}>
            <i className={cx('icon-add', styles.addDestinationIcon)} />
            {$t('Add Destination')}
          </div>
        </Button>
      )}
    </ButtonGroup>
  );
}
