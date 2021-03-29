import { useGoLiveSettings } from '../useGoLiveSettings';
import CommonPlatformFields from '../CommonPlatformFields';
import React from 'react';
import { createBinding, TagsInput } from '../../../shared/inputs';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';

export function TwitchEditStreamInfo() {
  const { updatePlatform, twSettings, renderPlatformSettings } = useGoLiveSettings(state => ({
    twSettings: state.platforms.twitch,
  }));

  const bind = createBinding(twSettings, updatedSettings =>
    updatePlatform('twitch', updatedSettings),
  );

  return (
    <Form name="twitch-settings">
      {renderPlatformSettings(
        <CommonPlatformFields key="common" platform="twitch" />,
        <TwitchTagsInput key="required" label={$t('Twitch Tags')} {...bind.tags} />,
        <GameSelector key="optional" platform={'twitch'} {...bind.game} />,
      )}
    </Form>
  );
}
