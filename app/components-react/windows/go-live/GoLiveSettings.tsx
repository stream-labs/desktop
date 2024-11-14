import React from 'react';
import styles from './GoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from 'services/i18n';
import { Row, Col } from 'antd';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import TwitterInput from './Twitter';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from 'components-react/shared/Spinner';
import GoLiveError from './GoLiveError';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
import ColorSpaceWarnings from './ColorSpaceWarnings';
import cx from 'classnames';
import { SingleOutputSettings } from './components/SingleOutputSettings';
import { DualOutputSettings } from './components/DualOutputSettings';

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function DualOutputGoLiveSettings() {
  const {
    isAdvancedMode,
    protectedModeEnabled,
    error,
    isLoading,
    isDualOutputMode,
    isRestreamEnabled,
    canUseOptimizedProfile,
    showTweet,
    hasMultiplePlatforms,
    enabledPlatforms,
    primaryChat,
    recommendedColorSpaceWarnings,
    setPrimaryChat,
  } = useGoLiveSettings().extend(module => {
    const { UserService, VideoEncodingOptimizationService } = Services;

    return {
      // in single output mode, only show destination switcher when tiktok has not been linked
      // users can always stream to tiktok
      showSelector:
        !UserService.views.isPrime &&
        !module.isDualOutputMode &&
        !module.isPlatformLinked('tiktok'),

      showTweet: UserService.views.auth?.primaryPlatform !== 'twitter',

      // temporarily hide the checkbox until streaming and output settings
      // are migrated to the new API
      canUseOptimizedProfile: !module.isDualOutputMode
        ? VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
          VideoEncodingOptimizationService.state.useOptimizedProfile
        : false,
      // canUseOptimizedProfile:
      //   VideoEncodingOptimizationService.state.canSeeOptimizedProfile ||
      //   VideoEncodingOptimizationService.state.useOptimizedProfile,
    };
  });

  const shouldShowSettings = !error && !isLoading;
  const shouldShowLeftCol = isDualOutputMode ? true : protectedModeEnabled;

  const shouldShowPrimaryChatSwitcher = isDualOutputMode
    ? isRestreamEnabled && hasMultiplePlatforms
    : hasMultiplePlatforms;

  return (
    <Row gutter={16} className={styles.settingsRow}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col
          span={8}
          className={cx(styles.leftColumn, { [styles.columnPadding]: !isDualOutputMode })}
        >
          {isDualOutputMode ? <DualOutputSettings /> : <SingleOutputSettings />}
          {shouldShowPrimaryChatSwitcher && (
            <PrimaryChatSwitcher
              className={styles.columnPadding}
              enabledPlatforms={enabledPlatforms}
              onSetPrimaryChat={setPrimaryChat}
              primaryChat={primaryChat}
            />
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={shouldShowLeftCol ? 16 : 24} className={styles.rightColumn}>
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
