import { CommonPlatformFields } from '../CommonPlatformFields';
import React from 'react';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import { createBinding } from '../../../shared/inputs';
import { ITwitchStartStreamOptions } from '../../../../services/platforms/twitch';
import Message from '../../../shared/Message';
import { Row, Col } from 'antd';

export function TwitchEditStreamInfo(p: IPlatformComponentParams<'twitch'>) {
  const twSettings = p.value;

  function updateSettings(patch: Partial<ITwitchStartStreamOptions>) {
    p.onChange({ ...twSettings, ...patch });
  }

  const bind = createBinding(twSettings, updatedSettings => updateSettings(updatedSettings));

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
        optionalFields={<TwitchTagsInput key="optional" label={$t('Twitch Tags')} {...bind.tags} />}
      />
      {p.layoutMode !== 'multiplatformSimple' && (
        <Row style={{ paddingBottom: '12px' }}>
          <Col span={8}></Col>
          <Col span={16} style={{ whiteSpace: 'normal', fontSize: '12px' }}>
            <Message type="info">
              {$t(
                "Warning! Editing tags in Streamlabs will overwrite tags in Twitch. To use Twitch's new custom tags, you must edit your tags in the Twitch dashboard directly until Twitch provides third parties access to editing the new custom tags.",
              )}
            </Message>
          </Col>
        </Row>
      )}
    </Form>
  );
}
