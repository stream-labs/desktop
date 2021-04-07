import CommonPlatformFields from './CommonPlatformFields';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import React from 'react';
import { TPlatform } from '../../../services/platforms';
import { TwitchEditStreamInfo } from './platforms/TwitchEditStreamInfo';
import { Section } from './Section';
import { YoutubeEditStreamInfo } from './platforms/YoutubeEditStreamInfo';
import FacebookEditStreamInfo from './platforms/FacebookEditStreamInfo';
import GoLiveError from './GoLiveError';

export default function PlatformSettings() {
  const {
    isMultiplatformMode,
    error,
    isAdvancedMode,
    enabledPlatforms,
    getPlatformDisplayName,
    isLoading,
  } = useGoLiveSettings();
  const shouldShowSettings = !error && !isLoading;

  return (
    // minHeight is required for the loading spinner
    <div style={{ minHeight: '150px' }}>
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
          {enabledPlatforms.map((platform: TPlatform) => (
            <Section
              title={$t('%{platform} Settings', { platform: getPlatformDisplayName(platform) })}
              isSimpleMode={!isAdvancedMode}
              key={platform}
            >
              {platform === 'twitch' && <TwitchEditStreamInfo />}
              {platform === 'facebook' && <FacebookEditStreamInfo />}
              {platform === 'youtube' && <YoutubeEditStreamInfo />}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
