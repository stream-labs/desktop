import React from 'react';
import styles from './DualOutputGoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { DualOutputDestinationSwitcher } from './DualOutputDestinationSwitcher';
import { $t } from 'services/i18n';
import { Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from '../Section';
import PlatformSettings from '../PlatformSettings';
import TwitterInput from '../Twitter';
import OptimizedProfileSwitcher from '../OptimizedProfileSwitcher';
import Spinner from 'components-react/shared/Spinner';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import UltraIcon from 'components-react/shared/UltraIcon';
import GoLiveError from '../GoLiveError';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function DualOutputGoLiveSettings() {
  const {
    addDestination,
    isAdvancedMode,
    protectedModeEnabled,
    error,
    isLoading,
    canAddDestinations,
    shouldShowPrimeLabel,
    canUseOptimizedProfile,
  } = useGoLiveSettings().extend(module => {
    const {
      RestreamService,
      SettingsService,
      UserService,
      MagicLinkService,
      VideoEncodingOptimizationService,
    } = Services;

    return {
      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 5;
      },

      addDestination() {
        // open the stream settings or prime page
        if (UserService.views.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else {
          MagicLinkService.linkToPrime('slobs-multistream');
        }
      },

      shouldShowPrimeLabel: !RestreamService.state.grandfathered,

      canUseOptimizedProfile:
        VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
        VideoEncodingOptimizationService.state.useOptimizedProfile,
    };
  });

  return (
    <Row gutter={16} className={styles.settingsRow}>
      {/*LEFT COLUMN*/}
      <Col span={8} className={styles.leftColumn}>
        {/*DESTINATION SWITCHERS*/}
        <DualOutputDestinationSwitcher />
        {/*ADD DESTINATION BUTTON*/}
        <a className={styles.addDestinationBtn} onClick={addDestination}>
          <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }} />
          {$t('Add Destination')}
          {shouldShowPrimeLabel && (
            <ButtonHighlighted
              filled
              text={$t('Ultra')}
              icon={
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
              }
            />
          )}
        </a>
      </Col>

      {/*RIGHT COLUMN*/}
      <Col span={16} className={styles.rightColumn}>
        <Spinner visible={isLoading} />
        <GoLiveError />
        <Scrollable style={{ height: '100%' }} snapToWindowEdge>
          {/*PLATFORM SETTINGS*/}
          <PlatformSettings />
          {/*ADD SOME SPACE IN ADVANCED MODE*/}
          {isAdvancedMode && <div className={styles.spacer} />}
          {/*EXTRAS*/}
          <Section isSimpleMode={!isAdvancedMode} title={$t('Extras')}>
            <TwitterInput />
            {!!canUseOptimizedProfile && <OptimizedProfileSwitcher />}
          </Section>
        </Scrollable>
      </Col>
    </Row>
  );
}
