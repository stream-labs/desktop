import { isAdvancedMode, TUpdatePlatformSettingsFn } from '../go-live';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { IGoLiveSettings } from '../../../../services/streaming';
import { createBinding, TagsInput } from '../../../shared/inputs';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';

interface IProps {
  settings: IGoLiveSettings;
  updatePlatformSettings: TUpdatePlatformSettingsFn;
}

export function TwitchEditStreamInfo(p: IProps) {
  const { settings, updatePlatformSettings } = p;
  const twSettings = settings.platforms.twitch;
  const isAdvanced = isAdvancedMode(p.settings);
  const vModel = createBinding(twSettings, newTwSettings =>
    updatePlatformSettings('twitch', newTwSettings),
  );

  function renderCommonFields() {
    return <CommonPlatformFields key="common" {...p} platform="twitch" />;
  }

  function renderRequiredFields() {
    return <TwitchTagsInput key="required" label={$t('Twitch Tags')} {...vModel('tags')} />;
  }

  function renderOptionalFields() {
    return <GameSelector key="optional" platform={'twitch'} {...vModel('game')} />;
  }

  return (
    <Form name="twitch-settings">
      {isAdvanced
        ? [renderRequiredFields(), renderOptionalFields(), renderCommonFields()]
        : [renderCommonFields(), renderRequiredFields()]}
    </Form>
  );
}
