import CommonPlatformFields from './CommonPlatformFields';
import { getEnabledPlatforms, IGoLiveProps } from './go-live';
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

export default function PlatformSettings(p: IProps) {
  console.log('render platform settings');
  const { settings, setSettings } = p;
  const enabledPlatforms = getEnabledPlatforms(settings);
  const { StreamingService } = Services;
  const view = StreamingService.views;
  const isMultiplePlatformMode = enabledPlatforms.length > 1;
  const hasPlatforms = enabledPlatforms.length > 0;

  const v = useVuex(() => {
    return {
      shouldShowSettings: !view.info.error && !view.isLoading && hasPlatforms,
      isAdvancedMode: view.goLiveSettings.advancedMode && view.isMultiplatformMode,
      isLive: view.isMidStreamMode,
      isPrepopulated: view.isPrepopulated(enabledPlatforms),
      isLoadingMode: view.isLoading,
    };
  });

  // don't render platform settings if platforms have not prepopulated the channel data
  if (!v.isPrepopulated) {
    return null;
  }

  /**
   * Update settings of a single platform
   **/
  function setPlatformSettings<T extends TPlatform>(
    platform: T,
    newPlatformSettings: IGoLiveSettings['platforms'][T],
  ) {
    setSettings({
      ...settings,
      platforms: {
        ...settings.platforms,
        [platform]: newPlatformSettings,
      },
    });
  }

  function render() {
    return (
      <div>
        {!hasPlatforms && $t('Enable at least one destination to start streaming')}

        {v.isLoadingMode && <Spin size="large" />}
        <GoLiveError />

        {v.shouldShowSettings && (
          <div style={{ width: '100%' }}>
            {/*COMMON FIELDS*/}
            {isMultiplePlatformMode && (
              <Section isSimpleMode={!v.isAdvancedMode} title={$t('Common Stream Settings')}>
                <CommonPlatformFields
                  settings={settings}
                  setPlatformSettings={setPlatformSettings}
                />
              </Section>
            )}

            {/*SETTINGS FOR EACH ENABLED PLATFORM*/}
            {enabledPlatforms.map((platform: TPlatform) => renderPlatformSettings(platform))}
          </div>
        )}
      </div>
    );
  }

  /**
   * Renders settings for one platform
   */
  function renderPlatformSettings(platform: TPlatform) {
    const platformName = getPlatformService(platform).displayName;
    const title = $t('%{platform} Settings', { platform: platformName });
    return (
      <Section title={title} isSimpleMode={!v.isAdvancedMode} key={platform}>
        {platform === 'twitch' && (
          <TwitchEditStreamInfo settings={settings} setPlatformSettings={setPlatformSettings} />
        )}
        {platform === 'facebook' && (
          <FacebookEditStreamInfo
            settings={settings}
            setPlatformSettings={setPlatformSettings}
            isUpdateMode={v.isLive}
            isScheduleMode={p.isScheduleMode}
          />
        )}
        {platform === 'youtube' && (
          <YoutubeEditStreamInfo
            settings={settings}
            setPlatformSettings={setPlatformSettings}
            isScheduleMode={p.isScheduleMode}
          />
        )}
      </Section>
    );
  }

  return render();
}
