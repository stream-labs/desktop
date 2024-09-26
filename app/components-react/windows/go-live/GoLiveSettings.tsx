import React from 'react';
import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import { Services } from '../../service-provider';
import { useGoLiveSettings } from './useGoLiveSettings';
import { DestinationSwitchers } from './DestinationSwitchers';
import { $t } from '../../../services/i18n';
import { Alert, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from '../../shared/Spinner';
import GoLiveError from './GoLiveError';
import TwitterInput from './Twitter';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
import ColorSpaceWarnings from './ColorSpaceWarnings';
import DualOutputToggle from '../../shared/DualOutputToggle';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings() {
  const {
    isAdvancedMode,
    protectedModeEnabled,
    error,
    isLoading,
    isPrime,
    canAddDestinations,
    canUseOptimizedProfile,
    showSelector,
    showTweet,
    addDestination,
    hasDestinations,
    hasMultiplePlatforms,
    enabledPlatforms,
    primaryChat,
    setPrimaryChat,
    recommendedColorSpaceWarnings,
  } = useGoLiveSettings().extend(module => {
    const { UserService, VideoEncodingOptimizationService, SettingsService } = Services;

    return {
      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 8;
      },

      // in single output mode, only show destination switcher when tiktok has not been linked
      // users can always stream to tiktok
      showSelector:
        !UserService.views.isPrime &&
        !module.isDualOutputMode &&
        !module.isPlatformLinked('tiktok'),

      isPrime: UserService.views.isPrime,

      canUseOptimizedProfile:
        VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
        VideoEncodingOptimizationService.state.useOptimizedProfile,

      showTweet: UserService.views.auth?.primaryPlatform !== 'twitter',

      addDestination() {
        SettingsService.actions.showSettings('Stream');
      },
    };
  });

  const shouldShowSettings = !error && !isLoading;
  const shouldShowLeftCol = protectedModeEnabled;
  const shouldShowAddDestButton = canAddDestinations && isPrime;
  const shouldShowPrimaryChatSwitcher = hasMultiplePlatforms;

  return (
    <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col span={8}>
          <Scrollable style={{ height: '81%' }} snapToWindowEdge>
            <DualOutputToggle />
            {/*DESTINATION SWITCHERS*/}
            <DestinationSwitchers showSelector={showSelector} />
            {/*ADD DESTINATION BUTTON*/}
            {shouldShowAddDestButton ? (
              <a className={styles.addDestinationBtn} onClick={addDestination}>
                <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }} />
                <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
              </a>
            ) : (
              <AddDestinationButton />
            )}
          </Scrollable>
          {shouldShowPrimaryChatSwitcher && (
            <PrimaryChatSwitcher
              enabledPlatforms={enabledPlatforms}
              onSetPrimaryChat={setPrimaryChat}
              primaryChat={primaryChat}
            />
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={shouldShowLeftCol ? 16 : 24} style={{ height: '100%' }}>
        <Spinner visible={isLoading} relative />
        <GoLiveError />
        {shouldShowSettings && (
          <Scrollable style={{ height: '100%' }} snapToWindowEdge>
            {recommendedColorSpaceWarnings && (
              <ColorSpaceWarnings warnings={recommendedColorSpaceWarnings} />
            )}
            {/*PLATFORM SETTINGS*/}
            <PlatformSettings />
            {/*ADD SOME SPACE IN ADVANCED MODE*/}
            {isAdvancedMode && <div className={styles.spacer} />}
            {/*EXTRAS*/}
            <Section isSimpleMode={!isAdvancedMode} title={$t('Extras')}>
              {showTweet && <TwitterInput />}
              {!!canUseOptimizedProfile && <OptimizedProfileSwitcher />}
            </Section>
          </Scrollable>
        )}
      </Col>
    </Row>
  );
}
