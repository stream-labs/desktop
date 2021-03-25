import CommonPlatformFields from './CommonPlatformFields';
import { getEnabledPlatforms, IGoLiveProps, useGoLiveSettings } from './useGoLiveSettings';
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
import LazySpinner from '../../shared/LazySpinner';
import { Skeleton } from 'antd';
import InputWrapper from '../../shared/inputs/InputWrapper';

export default function PlatformSettings() {
  console.log('render platform settings');
  const {
    isMultiplatformMode,
    error,
    isAdvancedMode,
    enabledPlatforms,
    getPlatformDisplayName,
    isLoading
  } = useGoLiveSettings(undefined, undefined, 'PlatformSettings');
  const shouldShowSettings = !error && isLoading;

  return (
    // minHeight is required for the loading spinner
    <div style={{ minHeight: '150px' }}>
      <GoLiveError />

      <LazySpinner visible={!error && isLoading} />

      {shouldShowSettings && (
        <div style={{ width: '100%' }}>
          {/*<Section isSimpleMode={!isAdvancedMode}>*/}
          {/*  <InputWrapper>*/}
          {/*    <Skeleton active={true} paragraph={false} />*/}
          {/*  </InputWrapper>*/}
          {/*  <InputWrapper>*/}
          {/*    <Skeleton.Input active={true} style={{ width: '100px' }} />*/}
          {/*  </InputWrapper>*/}
          {/*  <InputWrapper>*/}
          {/*    <Skeleton.Input active={true} style={{ width: '100%' }} />*/}
          {/*  </InputWrapper>*/}
          {/*</Section>*/}

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
