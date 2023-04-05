import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import { Services } from '../../service-provider';
import React from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { DestinationSwitchers } from './DestinationSwitchers';
import { $t } from '../../../services/i18n';
import { Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import TwitterInput from './Twitter';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from '../../shared/Spinner';
import ButtonHighlighted from '../../shared/ButtonHighlighted';
import UltraIcon from '../../shared/UltraIcon';
import GoLiveError from './GoLiveError';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings() {
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

  const shouldShowSettings = !error && !isLoading;
  const shouldShowLeftCol = protectedModeEnabled;
  const shouldShowAddDestButton = canAddDestinations;

  return (
    <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col span={8}>
          {/*DESTINATION SWITCHERS*/}
          <DestinationSwitchers />
          {/*ADD DESTINATION BUTTON*/}
          {shouldShowAddDestButton && (
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
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={shouldShowLeftCol ? 16 : 24} style={{ height: '100%' }}>
        <Spinner visible={isLoading} />
        <GoLiveError />
        {shouldShowSettings && (
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
        )}
      </Col>
    </Row>
  );
}
