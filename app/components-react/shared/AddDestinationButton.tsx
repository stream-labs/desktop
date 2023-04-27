import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import { Button } from 'antd';
import { ButtonGroup } from 'components-react/shared/ButtonGroup';
import UltraIcon from './UltraIcon';
import styles from './AddDestinationButton.m.less';
import cx from 'classnames';

interface IAddDestinationButtonProps {
  text?: string;
  className?: string;
  style?: CSSProperties;
}

export default function AddDestinationButton(p: IAddDestinationButtonProps) {
  const { addDestination, shouldShowPrimeLabel } = useGoLiveSettings().extend(module => {
    const { RestreamService, SettingsService, MagicLinkService, UserService } = Services;

    return {
      addDestination() {
        // open the stream settings or prime page
        if (UserService.views.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else {
          MagicLinkService.linkToPrime('slobs-multistream');
        }
      },

      shouldShowPrimeLabel: !RestreamService.state.grandfathered,
    };
  });

  return (
    <ButtonGroup
      className={styles.addDestinationGroup}
      align="center"
      direction="vertical"
      size="middle"
    >
      {/* {shouldShowPrimeLabel && ( */}
      <Button
        className={cx(styles.addDestinationBtn, p.className, styles.ultraBtn)}
        onClick={addDestination}
      >
        <div className={styles.btnText}>
          <i className={cx('icon-add', styles.addDestinationIcon)} />
          {$t('Add Destination with Ultra')}
        </div>
        <UltraIcon
          type="simple"
          style={{
            fill: '#09161D',
            display: 'inline-block',
            height: '12px',
            width: '12px',
            marginRight: '5px',
          }}
        />
      </Button>
      {/* )} */}
      {/* {!shouldShowPrimeLabel && ( */}
      <Button className={cx(styles.addDestinationBtn, p.className)} onClick={addDestination} block>
        <div className={styles.btnText}>
          <i className={cx('icon-add', styles.addDestinationIcon)} />
          {$t('Add Destination')}
        </div>
      </Button>
      {/* )} */}
    </ButtonGroup>
  );
}
