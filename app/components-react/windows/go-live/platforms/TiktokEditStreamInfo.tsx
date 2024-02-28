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
import { TextInput, createBinding } from 'components-react/shared/inputs';

export function TikTokEditStreamInfo(p: IPlatformComponentParams<'tiktok'>) {
  const ttSettings = p.value;
  const liveStreamingEnabled = Services.TikTokService.liveStreamingEnabled;
  const legacy = Services.TikTokService.getHasScope('legacy');

  function updateSettings(patch: Partial<ITikTokStartStreamOptions>) {
    p.onChange({ ...ttSettings, ...patch });
  }

  return (
    <Form name="tiktok-settings">
      {liveStreamingEnabled && (
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
      )}
      {legacy && <TikTokEnterCredentialsFormInfo {...p} />}
      {!liveStreamingEnabled && <TikTokStreamApplicationInfo />}
    </Form>
  );
}

function TikTokStreamApplicationInfo() {
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

export function TikTokEnterCredentialsFormInfo(p: IPlatformComponentParams<'tiktok'>) {
  const bind = createBinding(p.value, updatedSettings =>
    p.onChange({ ...p.value, ...updatedSettings }),
  );

  return (
    <>
      <TextInput label={$t('TikTok Server URL')} required {...bind.serverUrl} />
      <TextInput label={$t('TikTok Stream Key')} required {...bind.streamKey} />
      <InputWrapper
        extra={
          <>
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
            <p>
              <a onClick={openInfoPage}>
                {$t('Go live to TikTok with a single click. Click here to learn more.')}
              </a>
            </p>
          </>
        }
      >
        <Button onClick={openStreamPage} style={{ marginBottom: '10px' }}>
          {$t('Locate my Stream Key')}
        </Button>
      </InputWrapper>
    </>
  );
}

function openStreamPage() {
  const username = Services.UserService.state.auth?.platforms.tiktok?.username;
  remote.shell.openExternal(`https://www.tiktok.com/@${username}/live`);
}

function openInfoPage() {
  remote.shell.openExternal(Services.TikTokService.infoUrl);
}

function openApplicationInfoPage() {
  remote.shell.openExternal(Services.TikTokService.applicationUrl);
}
