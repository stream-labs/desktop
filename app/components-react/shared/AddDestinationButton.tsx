import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import { Button } from 'antd';
import { ButtonGroup } from 'components-react/shared/ButtonGroup';
import UltraIcon from './UltraIcon';
import ButtonHighlighted from './ButtonHighlighted';
import { PlusOutlined } from '@ant-design/icons';
import styles from './AddDestinationButton.m.less';
import cx from 'classnames';

const PlusIcon = PlusOutlined as Function;
interface IAddDestinationButtonProps {
  type?: 'single-output' | 'dual-output' | 'ultra';
  text?: string;
  className?: string;
  style?: CSSProperties;
}

export default function AddDestinationButton(p: IAddDestinationButtonProps) {
  const { addDestination, btnType, isDualOutputMode } = useGoLiveSettings().extend(module => {
    const {
      RestreamService,
      SettingsService,
      MagicLinkService,
      UsageStatisticsService,
      WebsocketService,
    } = Services;

    return {
      addDestination() {
        // open the stream settings or prime page
        if (module.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else if (module.isDualOutputMode) {
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

      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 8;
      },

      get btnType() {
        if (!RestreamService.state.grandfathered && !module.isPrime) return 'ultra';
        if (module.isDualOutputMode) return 'dual-output';
        if (!module.isDualOutputMode) return 'single-output';
      },
    };
  });

  const type = p?.type ?? btnType;

  return (
    <ButtonGroup
      className={cx(styles.addDestinationGroup, {
        [styles.ultraBtnGroup]: type === 'ultra',
      })}
      align="center"
      direction="vertical"
      size="middle"
      style={p?.style}
    >
      {type === 'single-output' && (
        <SingleOutputAddButton className={p?.className} addDestination={addDestination} />
      )}
      {type === 'dual-output' && (
        <DualOutputAddButton className={p?.className} addDestination={addDestination} />
      )}
      {type === 'ultra' && (
        <UltraAddButton
          className={p?.className}
          addDestination={addDestination}
          isDualOutputMode={isDualOutputMode}
        />
      )}
    </ButtonGroup>
  );
}

function SingleOutputAddButton(p: { className?: string; addDestination: () => void }) {
  return (
    <Button
      data-test="single-output-add-destination"
      className={cx(styles.addDestinationBtn, styles.singleOutputBtn, p.className)}
      onClick={p.addDestination}
      block
    >
      <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }} />
      <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
    </Button>
  );
}

function DualOutputAddButton(p: { className?: string; addDestination: () => void }) {
  return (
    <Button
      data-test="dual-output-add-destination"
      className={cx(styles.addDestinationBtn, styles.dualOutputBtn, p.className)}
      onClick={p.addDestination}
      block
    >
      <div className={styles.btnText}>
        <i className={cx('icon-add', styles.addDestinationIcon)} />
        {$t('Add Destination')}
      </div>
    </Button>
  );
}

function UltraAddButton(p: {
  className?: string;
  addDestination: () => void;
  isDualOutputMode: boolean;
}) {
  return (
    <ButtonHighlighted
      data-test="ultra-add-destination"
      faded
      className={cx(
        styles.addDestinationBtn,
        styles.ultraBtn,
        { [styles.dualOutputUltraBtn]: p.isDualOutputMode },
        p.className,
      )}
      onClick={p.addDestination}
    >
      <div className={styles.btnText}>
        <i className={cx('icon-add', styles.addDestinationIcon)} />
        {$t('Add Destination with Ultra')}
      </div>
      <UltraIcon type="night" className={styles.ultraIcon} />
    </ButtonHighlighted>
  );
}
