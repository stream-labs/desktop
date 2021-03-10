import styles from './GoLive.m.less';
import Scrollable from '../../shared/Scrollable';
import { Services } from '../../service-provider';
import React, { HTMLAttributes, useState } from 'react';
import { IGoLiveProps, useGoLiveSettings } from './go-live';
import { useFormState, useVuex } from '../../hooks';
import { DestinationSwitchers } from './DestinationSwitchers';
import { TPlatform } from '../../../services/platforms';
import { $t } from '../../../services/i18n';
import GoLiveError from './GoLiveError';
import { Spin, Row, Col, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Section } from './Section';
import { createBinding, TextInput } from '../../shared/inputs';
import PlatformSettings from './PlatformSettings';

const PlusIcon = PlusOutlined as Function;

/**
 * Renders settings for starting the stream
 * - Platform switchers
 * - Settings for each platform
 * - Extras settings
 **/
export default function GoLiveSettings(p: IGoLiveProps & HTMLAttributes<unknown>) {
  console.log('render GoLiveSettings');
  const {
    StreamingService,
    RestreamService,
    StreamSettingsService,
    SettingsService,
    UserService,
  } = Services;

  const {
    tweetText,
    updateSettings,
    isAdvancedMode,
    protectedModeEnabled,
    error,
    linkedPlatforms,
    enabledPlatforms,
    isLoading,
    customDestinations,
    streamTitle,
  } = useGoLiveSettings('GoLiveSettings', view => ({ streamTitle: view.platforms.twitch.title }));
  const bind = createBinding({ tweetText }, patch => updateSettings(patch));
  // const view = StreamingService.views;
  const shouldShowSettings = !error && !isLoading && enabledPlatforms.length;
  const shouldShowPrimeLabel = !RestreamService.state.grandfathered;
  const shouldShowLeftCol = protectedModeEnabled;
  const shouldShowAddDestButton = linkedPlatforms.length + customDestinations.length < 5;

  // // define a reactive state
  // const v = useVuex(() => {
  //   const goLiveSettings = view.savedSettings;
  //   const isErrorMode = !!view.info.error;
  //   const enabledPlatforms = view.enabledPlatforms;
  //   const isLoadingMode = view.isLoading;
  //   const linkedPlatformsCnt = view.linkedPlatforms.length;
  //
  //   return {
  //     linkedPlatformsCnt,
  //     isLoadingMode,
  //     enabledPlatforms,
  //     shouldShowSettings: !isErrorMode && !isLoadingMode && enabledPlatforms.length,
  //     // isAdvancedMode: goLiveSettings.advancedMode && view.isMultiplatformMode,
  //     shouldShowPrimeLabel: !RestreamService.state.grandfathered,
  //     shouldShowLeftCol: StreamSettingsService.state.protectedModeEnabled,
  //     shouldShowAddDestButton: linkedPlatformsCnt + goLiveSettings.customDestinations.length < 5,
  //   };
  // });

  function switchPlatform(platform: TPlatform, enabled: boolean) {
    // // save settings
    // const platforms = cloneDeep(settings.platforms);
    // platforms[platform].enabled = enabled;
    // updateSettings({ platforms });
  }

  function switchCustomDest(destInd: number, enabled: boolean) {
    // // save settings
    // const customDestinations = cloneDeep(settings.customDestinations);
    // customDestinations[destInd].enabled = enabled;
    // updateSettings({ customDestinations });
  }

  function onDestinationSwitchHandler(enabledPlatforms: TPlatform[], enabledCutomDests: number[]) {
    // const platforms = cloneDeep(settings.platforms);
    // keys(platforms).forEach(
    //   platform => platforms[platform].enabled === enabledPlatforms.includes(platform),
    // );
    // updateSettings({ platforms });
  }

  function addDestination() {
    // open the stream settings or prime page
    if (RestreamService.views.canEnableRestream) {
      SettingsService.actions.showSettings('Stream');
    } else {
      UserService.openPrimeUrl('slobs-multistream');
    }
  }

  async function confirmButton() {
    // const msg = '<settings-link>Click here</settings-link> to check our settings';
    //
    // return (
    //   <Translate message={msg}>
    //     <a slot="settings-link" onClick={openSettings} />
    //   </Translate>
    // );
  }

  console.log('GoLiveSettings isLoading', isLoading);
  return (
    <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
      {/*LEFT COLUMN*/}
      {shouldShowLeftCol && (
        <Col span={8}>
          {/*DESTINATION SWITCHERS*/}
          <DestinationSwitchers
          // platforms={settings.platforms}
          // customDestinations={settings.customDestinations}
          // title="Stream to %{platformName}"
          // canDisablePrimary={false}
          // onChange={onDestinationSwitchHandler}
          />
          {/*ADD DESTINATION BUTTON*/}
          {shouldShowAddDestButton && (
            <a className={styles.addDestinationBtn} onClick={addDestination}>
              <PlusIcon />
              {$t('Add Destination')}{' '}
              {shouldShowPrimeLabel && <b className={styles.prime}>prime</b>}
            </a>
          )}
        </Col>
      )}

      {/*RIGHT COLUMN*/}
      <Col span={16} style={{ height: '100%' }}>
        <Scrollable style={{ maxHeight: '100%' }} snapToWindowEdge>
          {isLoading && <Spin size="large" />}
          <GoLiveError />

          {shouldShowSettings && (
            <>
              {/*PLATFORM SETTINGS*/}
              <PlatformSettings />
              {/*ADD SOME SPACE*/}
              {!isAdvancedMode && <div className={styles.spacer} />}
              <TextInput uncontrolled={false} {...bind.tweetText} />
              {tweetText}
              TwitchTitle
              {streamTitle}
              {/*EXTRAS*/}
              <Section title={isAdvancedMode ? $t('Extras') : ''}>
                {/*<TwitterInput*/}
                {/*  {...bind.tweetText}*/}
                {/*  streamTitle={view.getCommonFields(settings.platforms).title}*/}
                {/*/>*/}
                {/*<OptimizedProfileSwitcher*/}
                {/*  value*/}
                {/*/>*/}
              </Section>
            </>
          )}
        </Scrollable>
      </Col>
    </Row>
  );
}
