import { isAdvancedMode, TSetPlatformSettingsFn } from '../go-live';
import FormSection from '../../../shared/inputs/FormSection';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { IGoLiveSettings } from '../../../../services/streaming';
import { createVModel, TagsInput } from '../../../shared/inputs';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';

interface IProps {
  settings: IGoLiveSettings;
  setPlatformSettings: TSetPlatformSettingsFn;
}

export function TwitchEditStreamInfo(p: IProps) {
  const { settings, setPlatformSettings } = p;
  const twSettings = settings.platforms.twitch;
  const isAdvanced = isAdvancedMode(p.settings);
  const vModel = createVModel(twSettings, newTwSettings =>
    setPlatformSettings('twitch', newTwSettings),
  );

  function render() {
    return (
      <FormSection name="twitch-settings">
        {isAdvanced
          ? [renderRequiredFields(), renderOptionalFields(), renderCommonFields()]
          : [renderCommonFields(), renderRequiredFields()]}
      </FormSection>
    );
  }

  function renderCommonFields() {
    return <CommonPlatformFields {...p} platform="twitch" />;
  }

  function renderRequiredFields() {
    return <TwitchTagsInput label={$t('Twitch Tags')} {...vModel('tags')} />;
  }

  function renderOptionalFields() {
    return <GameSelector platform={'twitch'} {...vModel('game')} />;
  }

  return render();
}
