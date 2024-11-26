import React from 'react';
import styles from './GoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from 'services/i18n';
import { Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from './Section';
import PlatformSettings from './PlatformSettings';
import TwitterInput from './Twitter';
import OptimizedProfileSwitcher from './OptimizedProfileSwitcher';
import Spinner from 'components-react/shared/Spinner';
import GoLiveError from './GoLiveError';
import UserSettingsUltra from './dual-output/UserSettingsUltra';
import UserSettingsNonUltra from './dual-output/UserSettingsNonUltra';
import PrimaryChatSwitcher from './PrimaryChatSwitcher';
import ColorSpaceWarnings from './ColorSpaceWarnings';
import DualOutputToggle from 'components-react/shared/DualOutputToggle';
import { DestinationSwitchers } from './DestinationSwitchers';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import cx from 'classnames';

const PlusIcon = PlusOutlined as Function;

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
    isPrime,
    isDualOutputMode,
    isRestreamEnabled,
    canAddDestinations,
    canUseOptimizedProfile,
    showSelector,
    showTweet,
    hasMultiplePlatforms,
    enabledPlatforms,
    primaryChat,
    recommendedColorSpaceWarnings,
    addDestination,
    setPrimaryChat,
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

      showTweet: UserService.views.auth?.primaryPlatform !== 'twitter',

      addDestination() {
        SettingsService.actions.showSettings('Stream');
      },

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
  const shouldShowAddDestButton = canAddDestinations && isPrime;

  const shouldShowPrimaryChatSwitcher = isDualOutputMode
    ? isRestreamEnabled && hasMultiplePlatforms
    : hasMultiplePlatforms;
  // TODO: make sure this doesn't jank the UI
  const leftPaneHeight = shouldShowPrimaryChatSwitcher ? '81%' : '100%';

  return (
    <Row gutter={16} className={styles.settingsRow}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col
          span={8}
          className={cx(styles.leftColumn, { [styles.columnPadding]: !isDualOutputMode })}
        >
          {isDualOutputMode ? (
            <Scrollable style={{ height: leftPaneHeight }}>
              {isPrime && <UserSettingsUltra />}
              {!isPrime && <UserSettingsNonUltra />}
            </Scrollable>
          ) : (
            <SingleOutputSettings
              showSelector={showSelector}
              addDestination={addDestination}
              shouldShowAddDestButton={shouldShowAddDestButton}
            />
          )}
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

function SingleOutputSettings(p: {
  showSelector: boolean;
  addDestination: () => void;
  shouldShowAddDestButton: boolean;
}) {
  return (
    <Scrollable style={{ height: '81%' }} snapToWindowEdge>
      <DualOutputToggle
        className={cx(styles.dualOutputToggle, styles.columnPadding)}
        type="single"
        lightShadow
      />
      {/*DESTINATION SWITCHERS*/}
      <DestinationSwitchers showSelector={p.showSelector} />

      {/*ADD DESTINATION BUTTON*/}
      {p.shouldShowAddDestButton ? (
        <div className={styles.columnPadding}>
          <a className={styles.addDestinationBtn} onClick={p.addDestination}>
            <PlusIcon style={{ paddingLeft: '17px', fontSize: '24px' }} />
            <span style={{ flex: 1 }}>{$t('Add Destination')}</span>
          </a>
        </div>
      ) : (
        <AddDestinationButton />
      )}
    </Scrollable>
  );
}
