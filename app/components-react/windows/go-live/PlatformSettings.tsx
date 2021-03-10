import CommonPlatformFields from './CommonPlatformFields';
import { getEnabledPlatforms, IGoLiveProps, useGoLiveSettings } from './go-live';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import React from 'react';
import { useVuex } from '../../hooks';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { TwitchEditStreamInfo } from './platforms/TwitchEditStreamInfo';
import { Section } from './Section';
import { IGoLiveSettings } from '../../../services/streaming';
import { YoutubeEditStreamInfo } from './platforms/youtube/YoutubeEditStreamInfo';
import FacebookEditStreamInfo from './platforms/FacebookEditStreamInfo';
import GoLiveError from './GoLiveError';
import { Spin } from 'antd';

interface IProps extends IGoLiveProps {
  isScheduleMode?: boolean;
}

export default function PlatformSettings() {
  console.log('render platform settings');
  const {
    isMultiplatformMode,
    error,
    isLoading,
    isAdvancedMode,
    enabledPlatforms,
  } = useGoLiveSettings('PlatformSettings');
  const shouldShowSettings = !error && !isLoading;

  /**
   * Update settings of a single platform
   **/
  // function updatePlatformSettings<T extends TPlatform>(
  //   platform: T,
  //   settingsPatch: Partial<IGoLiveSettings['platforms'][T]>,
  // ) {
  //   updateSettings({
  //     ...settings,
  //     platforms: {
  //       ...settings.platforms,
  //       [platform]: { ...settings.platforms[platform], ...settingsPatch },
  //     },
  //   });
  // }


  /**
   * Renders settings for one platform
   */
  function renderPlatformSettings(platform: TPlatform) {
    const platformName = getPlatformService(platform).displayName;
    const title = $t('%{platform} Settings', { platform: platformName });
    return (
      <Section title={title} isSimpleMode={!isAdvancedMode} key={platform}>
        {platform === 'twitch' && <TwitchEditStreamInfo />}
        {/*{platform === 'facebook' && (*/}
        {/*  <FacebookEditStreamInfo*/}
        {/*    // settings={settings}*/}
        {/*    // updatePlatformSettings={updatePlatformSettings}*/}
        {/*    // isUpdateMode={v.isLive}*/}
        {/*    // isScheduleMode={p.isScheduleMode}*/}
        {/*  />*/}
        {/*)}*/}
        {/*{platform === 'youtube' && (*/}
        {/*  <YoutubeEditStreamInfo*/}
        {/*    // settings={settings}*/}
        {/*    // updatePlatformSettings={updatePlatformSettings}*/}
        {/*    // isScheduleMode={p.isScheduleMode}*/}
        {/*  />*/}
        {/*)}*/}
      </Section>
    );
  }

  return (
    <div>
      {isLoading && <Spin size="large" />}
      <GoLiveError />

      {shouldShowSettings && (
        <div style={{ width: '100%' }}>
          {/*COMMON FIELDS*/}
          {isMultiplatformMode && (
            <Section isSimpleMode={!isAdvancedMode} title={$t('Common Stream Settings')}>
              <CommonPlatformFields />
            </Section>
          )}

          {/*SETTINGS FOR EACH ENABLED PLATFORM*/}
          {enabledPlatforms.map((platform: TPlatform) => renderPlatformSettings(platform))}
        </div>
      )}
    </div>
  );
}
