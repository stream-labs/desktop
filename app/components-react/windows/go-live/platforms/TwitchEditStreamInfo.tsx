import { TUpdatePlatformSettingsFn, useGoLiveSettings } from '../go-live';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { IGoLiveSettings } from '../../../../services/streaming';
import { createBinding, TagsInput } from '../../../shared/inputs';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';

interface IProps {
  // settings: IGoLiveSettings;
  // updatePlatformSettings: TUpdatePlatformSettingsFn;
}

export function TwitchEditStreamInfo() {
  const { updatePlatform, twSettings, settingsMode } = useGoLiveSettings(
    'TwitchEditStreamInfo',
    state => ({
      twSettings: state.platforms.twitch,
    }),
  );

  const bind = createBinding(twSettings, updatedSettings =>
    updatePlatform('twitch', updatedSettings),
  );

  // const twSettings = settings.platforms.twitch;
  // const bind = createBinding(twSettings, newTwSettings =>
  //   updatePlatformSettings('twitch', newTwSettings),
  // );

  function renderCommonFields() {
    return <CommonPlatformFields key="common" platform="twitch" />;
  }

  function renderRequiredFields() {
    return <TwitchTagsInput key="required" label={$t('Twitch Tags')} {...bind.tags} />;
  }

  function renderOptionalFields() {
    return <GameSelector key="optional" platform={'twitch'} {...bind.game} />;
  }

  return (
    <Form name="twitch-settings">
      {settingsMode === 'singlePlatform' && [
        renderCommonFields(),
        renderRequiredFields(),
        renderOptionalFields(),
      ]}
      {settingsMode === 'multiplatformSimple' && renderRequiredFields()}
      {settingsMode === 'multiplatformAdvanced' && [
        renderRequiredFields(),
        renderOptionalFields(),
        renderCommonFields(),
      ]}
    </Form>
  );
}
