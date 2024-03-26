import { CommonPlatformFields } from '../CommonPlatformFields';
import React from 'react';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import { CheckboxInput, ListInput, createBinding } from '../../../shared/inputs';
import { ITwitchStartStreamOptions } from '../../../../services/platforms/twitch';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import Message from '../../../shared/Message';
import { Row, Col, Select } from 'antd';
import { IListOption } from 'components/shared/inputs';
import TwitchContentClassificationInput from './TwitchContentClassificationInput';

export function TwitchEditStreamInfo(p: IPlatformComponentParams<'twitch'>) {
  const twSettings = p.value;

  function updateSettings(patch: Partial<ITwitchStartStreamOptions>) {
    p.onChange({ ...twSettings, ...patch });
  }

  const bind = createBinding(twSettings, updatedSettings => updateSettings(updatedSettings));

  const optionalFields = (
    <div key="optional">
      <TwitchTagsInput label={$t('Twitch Tags')} {...bind.tags} />
      <TwitchContentClassificationInput {...bind.contentClassificationLabels} />
      <InputWrapper>
        <CheckboxInput label={$t('Stream features branded content')} {...bind.isBrandedContent} />
      </InputWrapper>
    </div>
  );
  return (
    <Form name="twitch-settings">
      <PlatformSettingsLayout
        layoutMode={p.layoutMode}
        commonFields={
          <CommonPlatformFields
            key="common"
            platform="twitch"
            layoutMode={p.layoutMode}
            value={twSettings}
            onChange={updateSettings}
          />
        }
        requiredFields={<GameSelector key="required" platform={'twitch'} {...bind.game} />}
        optionalFields={optionalFields}
      />
    </Form>
  );
}
