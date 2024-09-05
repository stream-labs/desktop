import React from 'react';
import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import { Services } from '../../service-provider';
import { useGoLiveSettings } from './useGoLiveSettings';
import { DestinationSwitchers } from './destination-switchers/DestinationSwitchers';
import { $t } from '../../../services/i18n';
import { Row, Col } from 'antd';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from '../../shared/Spinner';
import GoLiveError from './GoLiveError';
import TwitterInput from './Twitter';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
import ColorSpaceWarnings from './ColorSpaceWarnings';
import InfoBadge from 'components-react/shared/InfoBadge';
import Translate from 'components-react/shared/Translate';
import cx from 'classnames';

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
    isDualOutputMode,
    isRestreamEnabled,
    canAddDestinations,
    canUseOptimizedProfile,
    showTweet,
    hasMultiplePlatforms,
    enabledPlatforms,
    shouldShowUltraButton,
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

      get shouldShowUltraButton() {
        // never show for ultra accounts
        if (module.isPrime) return false;
        // always show for non-ultra single output mode
        const nonUltraSingleOutput = !module.isDualOutputMode;

        // only show in dual output mode when 2 targets are enabled
        const enabledPlatforms = module.state.enabledPlatforms;
        const enabledCustomDestinations = module.state.enabledCustomDestinations;
        const numTargets = enabledPlatforms.length + enabledCustomDestinations.length;
        const nonUltraDualOutputMaxTargets = numTargets > 1;

        return nonUltraSingleOutput || (nonUltraDualOutputMaxTargets && module.isDualOutputMode);
      },

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
  const shouldShowLeftCol = protectedModeEnabled || isDualOutputMode;
  const shouldShowAddDestButton = isPrime ? canAddDestinations : shouldShowUltraButton;
  const shouldShowPrimaryChatSwitcher = isDualOutputMode
    ? isRestreamEnabled && hasMultiplePlatforms
    : hasMultiplePlatforms;

  const gutter = isDualOutputMode ? 8 : 16;

  // setting conditional styling using the below instead of a css class
  // is necessary to preserve the styling of the scrollbar
  const backgroundColor = isDualOutputMode ? 'var(--dark-background)' : 'auto';

  return (
    <Row gutter={gutter} style={{ height: '100%' }}>
      {/*SINGLE OUTPUT LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col
          span={8}
          className={cx(styles.leftColumn, { [styles.dualOutputLeftColumn]: isDualOutputMode })}
        >
          <Scrollable
            style={{
              height: '81%',
              backgroundColor,
              display: 'flex',
              alignItems: 'space-between',
              justifyContent: 'space-between',
            }}
            snapToWindowEdge={!isDualOutputMode}
          >
            <div
              className={cx(styles.destinationSwitchersWrapper, {
                [styles.dualOutputSwitchersWrapper]: isDualOutputMode,
              })}
            >
              {/*DUAL OUTPUT INFO BADGE*/}
              {isDualOutputMode && (
                <InfoBadge
                  content={
                    <Translate message="<dualoutput>Dual Output</dualoutput> is enabled - you must stream to one horizontal and one vertical platform.">
                      <u slot="dualoutput" />
                    </Translate>
                  }
                  className={styles.switcherInfoBadge}
                />
              )}

              {/*DESTINATION SWITCHERS*/}
              <DestinationSwitchers />

              {/*ADD DESTINATION BUTTON*/}
              {shouldShowAddDestButton && <AddDestinationButton data-type="add-dest-btn" />}
            </div>
          </Scrollable>
          {/* PRIMARY CHAT SWITCHER */}
          {shouldShowPrimaryChatSwitcher && (
            <PrimaryChatSwitcher
              className={cx(styles.primaryChatSwitcher, {
                [styles.dualOutputChatSwitcher]: isDualOutputMode,
              })}
              enabledPlatforms={enabledPlatforms}
              onSetPrimaryChat={setPrimaryChat}
              primaryChat={primaryChat}
            />
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col
        span={shouldShowLeftCol ? 16 : 24}
        style={{ height: '100%' }}
        className={styles.rightColumn}
      >
        <Spinner visible={isLoading} relative />
        <GoLiveError />
        {shouldShowSettings && (
          <Scrollable style={{ height: '100%' }} className={styles.rightScroller} snapToWindowEdge>
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
