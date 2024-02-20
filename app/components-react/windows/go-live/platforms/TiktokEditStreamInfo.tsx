import React from 'react';
import Form from '../../../shared/inputs/Form';
import { $t } from '../../../../services/i18n';
import { Services } from '../../../service-provider';
import { Button } from 'antd';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import * as remote from '@electron/remote';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { ITikTokStartStreamOptions } from 'services/platforms/tiktok';

export function TikTokEditStreamInfo(p: IPlatformComponentParams<'tiktok'>) {
  const ttSettings = p.value;
  const liveStreamingEnabled = Services.TikTokService.liveStreamingEnabled;

  function updateSettings(patch: Partial<ITikTokStartStreamOptions>) {
    p.onChange({ ...ttSettings, ...patch });
  }

  return (
    <Form name="tiktok-settings">
      {liveStreamingEnabled ? (
        <PlatformSettingsLayout
          layoutMode={p.layoutMode}
          commonFields={
            <CommonPlatformFields
              key="common"
              platform="tiktok"
              layoutMode={p.layoutMode}
              value={ttSettings}
              onChange={updateSettings}
            />
          }
          requiredFields={<div key={'empty-tiktok'} />}
        />
      ) : (
        <TikTokStreamApplicationInfo />
      )}
    </Form>
  );
}

function TikTokStreamApplicationInfo() {
  function openInfoPage() {
    remote.shell.openExternal(Services.TikTokService.infoUrl);
  }

  function openApplicationInfoPage() {
    remote.shell.openExternal(Services.TikTokService.applicationUrl);
  }

  return (
    <InputWrapper
      extra={
        <p>
          <a onClick={openInfoPage}>{$t('Click here to learn more about streaming on TikTok')}</a>
        </p>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '5px' }}>
          {$t('You do not have permission to stream live to TikTok.')}
        </div>
        <Button
          onClick={openApplicationInfoPage}
          style={{
            marginBottom: '10px',
            background: 'var(--tiktok-btn)',
            color: 'var(--black)',
          }}
        >
          {$t('Apply for TikTok Live Permission')}
        </Button>
      </div>
    </InputWrapper>
  );
}
