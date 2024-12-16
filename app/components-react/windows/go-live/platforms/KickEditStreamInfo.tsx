import React from 'react';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { Services } from '../../../service-provider';
import { $t } from 'services/i18n';
import Form from '../../../shared/inputs/Form';
import { createBinding, InputComponent } from '../../../shared/inputs';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import { IKickStartStreamOptions } from '../../../../services/platforms/kick';
import InfoBanner from 'components-react/shared/InfoBanner';
import * as remote from '@electron/remote';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import { TextInput } from 'components-react/shared/inputs';

/***
 * Stream Settings for Kick
 */
export const KickEditStreamInfo = InputComponent((p: IPlatformComponentParams<'kick'>) => {
  function updateSettings(patch: Partial<IKickStartStreamOptions>) {
    p.onChange({ ...kickSettings, ...patch });
  }

  const kickSettings = p.value;
  const bind = createBinding(kickSettings, newKickSettings => updateSettings(newKickSettings));

  return (
    <Form name="kick-settings">
      <PlatformSettingsLayout
        layoutMode={p.layoutMode}
        commonFields={
          <InputWrapper
            extra={
              <InfoBanner
                id="kick-info"
                message={$t('Edit your stream title on Kick after going live.')}
                onClick={() => {
                  remote.shell.openExternal(Services.KickService.streamPageUrl);
                }}
                type="warning"
                style={{ marginTop: '5px', marginBottom: '5px' }}
              />
            }
          />
        }
        requiredFields={<div key={'empty-kick'} />}
      />
      {/* <InputWrapper
        extra={
          <>
            <TextInput
              value={''}
              name="title"
              label={$t('Title')}
              required={false}
              tooltip={$t('Edit your stream title on Kick after going live.')}
              disabled={true}
            />
            <InfoBanner
              id="kick-info"
              message={$t('Edit your stream title on Kick after going live.')}
              onClick={() => {
                remote.shell.openExternal(Services.KickService.streamPageUrl);
              }}
              type="warning"
              style={{ marginTop: '5px', marginBottom: '5px' }}
            />
          </>
        }
      /> */}
    </Form>
  );
});
