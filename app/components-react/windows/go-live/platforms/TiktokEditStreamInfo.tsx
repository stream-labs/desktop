import { useGoLiveSettings } from '../useGoLiveSettings';
import React from 'react';
import { createBinding, TextInput } from '../../../shared/inputs';
import Form from '../../../shared/inputs/Form';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import electron from 'electron';
import { $t } from '../../../../services/i18n';
import { Services } from '../../../service-provider';

export function TiktokEditStreamInfo() {
  const { updatePlatform, ttSettings } = useGoLiveSettings(state => ({
    ttSettings: state.platforms.tiktok,
  }));

  const bind = createBinding(ttSettings, updatedSettings =>
    updatePlatform('tiktok', updatedSettings),
  );

  return (
    <Form name="tiktok-settings">
      <TextInput label={$t('TikTok Server URL')} required {...bind.serverUrl} />
      <TextInput
        label={$t('TikTok Stream Key')}
        required
        {...bind.streamKey}
        extra={<a onClick={openStreamPage}>{$t('Locate my Stream Key')}</a>}
      />
    </Form>
  );
}

function openStreamPage() {
  const username = Services.UserService.state.auth?.platforms.tiktok?.username;
  electron.remote.shell.openExternal(`https://www.tiktok.com/@${username}/live`);
}
