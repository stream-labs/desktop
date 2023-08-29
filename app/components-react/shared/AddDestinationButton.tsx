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
  const { addDestination, shouldShowPrimeLabel } = useGoLiveSettings().extend(module => {
    const {
      RestreamService,
      SettingsService,
      MagicLinkService,
      UserService,
      UsageStatisticsService,
    } = Services;

    return {
      addDestination() {
        // open the stream settings or prime page
        if (UserService.views.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else {
          // record dual output analytics event
          UsageStatisticsService.recordAnalyticsEvent('DualOutput', {
            type: 'UpgradeToUltra',
          });
          MagicLinkService.linkToPrime('slobs-multistream');
        }
      },

      shouldShowPrimeLabel:
        p.type === 'ultra' || (!RestreamService.state.grandfathered && !UserService.views.isPrime),
    };
  });

  return (
    <ButtonGroup
      className={styles.addDestinationGroup}
      align="center"
      direction="vertical"
      size="middle"
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
