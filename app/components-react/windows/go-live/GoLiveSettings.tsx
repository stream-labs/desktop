import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import PlatformSettings from './PlatformSettings';
import { Services } from '../../service-provider';
import cx from 'classnames';
import React, { HTMLAttributes } from 'react';
import { IGoLiveProps } from './go-live';
import { useVuex } from '../../hooks';
import { DestinationSwitchers } from './DestinationSwitchers';
import { TPlatform } from '../../../services/platforms';
import { $t } from '../../../services/i18n';
import GoLiveError from './GoLiveError';
import { Spin, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings(p: IGoLiveProps & HTMLAttributes<unknown>) {
  console.log('render GoLiveSettings');
  const { settings, setSettings } = p;
  const {
    StreamingService,
    RestreamService,
    StreamSettingsService,
    SettingsService,
    UserService,
  } = Services;

  // define a reactive state
  const v = useVuex(() => {
    const view = StreamingService.views;
    const goLiveSettings = view.goLiveSettings;
    const isErrorMode = !!view.info.error;
    const enabledPlatforms = view.enabledPlatforms;
    const isLoadingMode = view.isLoading;
    const linkedPlatformsCnt = view.linkedPlatforms.length;
    return {
      linkedPlatformsCnt,
      isLoadingMode,
      enabledPlatforms,
      shouldShowSettings: !isErrorMode && !isLoadingMode && enabledPlatforms.length,
      isAdvancedMode: goLiveSettings.advancedMode && view.isMultiplatformMode,
      shouldShowPrimeLabel: !RestreamService.state.grandfathered,
      shouldShowLeftCol: StreamSettingsService.state.protectedModeEnabled,
      shouldShowAddDestButton: linkedPlatformsCnt + goLiveSettings.customDestinations.length < 5,
    };
  });

  function switchPlatform(platform: TPlatform, enabled: boolean) {
    // save settings
    // TODO:
    settings.platforms[platform].enabled = enabled;
    StreamSettingsService.setGoLiveSettings(settings);

    // preload channel data
    StreamingService.actions.prepopulateInfo();
  }

  function switchCustomDest(destInd: number, enabled: boolean) {
    // save settings
    // TODO:
    settings.customDestinations[destInd].enabled = enabled;
    StreamSettingsService.actions.setGoLiveSettings(settings);
  }

  function addDestination() {
    // open the stream settings or prime page
    if (RestreamService.views.canEnableRestream) {
      SettingsService.actions.showSettings('Stream');
    } else {
      UserService.openPrimeUrl('slobs-multistream');
    }
  }

  console.log('GoLiveSettings isLoading', v.isLoadingMode);
  return (
    <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
      {/*LEFT COLUMN*/}
      {v.shouldShowLeftCol && (
        <Col span={8}>
          {/*DESTINATION SWITCHERS*/}
          <DestinationSwitchers
            platforms={settings.platforms}
            customDestinations={settings.customDestinations}
            title="Stream to %{platformName}"
            canDisablePrimary={false}
            onPlatformSwitch={switchPlatform}
            onCustomDestSwitch={switchCustomDest}
          />
          {/*ADD DESTINATION BUTTON*/}
          {v.shouldShowAddDestButton && (
            <a className={styles.addDestinationBtn} onClick={addDestination}>
              <PlusIcon />
              {$t('Add Destination')}{' '}
              {v.shouldShowPrimeLabel && <b className={styles.prime}>prime</b>}
            </a>
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={16} style={{ height: '100%' }}>
        <Scrollable style={{ maxHeight: '100%' }} snapToWindowEdge>
          {v.isLoadingMode && <Spin size="large" />}
          <GoLiveError />

          {v.shouldShowSettings && (
            <>
              {/*PLATFORM SETTINGS*/}
              <PlatformSettings settings={settings} setSettings={setSettings} />

              {/*ADD SOME SPACE*/}
              {!v.isAdvancedMode && <div className={styles.spacer} />}

              {/*/!*EXTRAS*!/*/}
              {/*<Section title={isAdvancedMode ? $t('Extras') : ''}>*/}
              {/*  <Twitter*/}
              {/*    vModel={this.settings.tweetText}*/}
              {/*    streamTitle={this.view.getCommonFields(this.settings).title}*/}
              {/*  />*/}
              {/*  <OptimizedProfileSwitcher*/}
              {/*    vModel={this.settings.optimizedProfile}*/}
              {/*    settings={this.settings}*/}
              {/*  />*/}
              {/*</Section>*/}
            </>
          )}
        </Scrollable>
      </Col>
    </Row>
  );
}
