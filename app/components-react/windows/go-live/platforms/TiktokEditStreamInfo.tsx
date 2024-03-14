import React from 'react';
import Form from '../../../shared/inputs/Form';
import { $t } from '../../../../services/i18n';
import { Services } from '../../../service-provider';
import { Button, Tooltip } from 'antd';
// import Tooltip from 'components-react/shared/Tooltip';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import * as remote from '@electron/remote';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { ITikTokStartStreamOptions } from 'services/platforms/tiktok';
import { TextInput, createBinding } from 'components-react/shared/inputs';

export function TikTokEditStreamInfo(p: IPlatformComponentParams<'tiktok'>) {
  const ttSettings = p.value;
  const liveStreamingEnabled = Services.TikTokService.liveStreamingEnabled;
  const legacy = Services.TikTokService.scope === 'legacy';

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
        <a onClick={() => openInfoPage()}>
          {$t('Go live to TikTok with a single click. Click here to learn more.')}
        </a>
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
      <TextInput
        label={
          <Tooltip title={$t('Generate with "Locate my Stream Key"')} placement="right">
            {$t('TikTok Server URL')}
            <i className="icon-information" style={{ marginLeft: '5px' }} />
          </Tooltip>
        }
        required
        {...bind.serverUrl}
      />
      <TextInput
        label={
          // eslint-disable-next-line prettier/prettier
          <Tooltip title={$t('Generate with "Locate my Stream Key"')} placement="right">
            {$t('TikTok Stream Key')}
            <i className="icon-information" style={{ marginLeft: '5px' }} />
          </Tooltip>
        }
        required
        {...bind.streamKey}
      />
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
            <a onClick={() => openInfoPage()}>
              {$t('Go live to TikTok with a single click. Click here to learn more.')}
            </a>
          </>
        }
      >
        <Button onClick={openProducer} style={{ marginBottom: '10px' }}>
          {$t('Locate my Stream Key')}
        </Button>
      </InputWrapper>
    </>
  );
}

function openInfoPage() {
  remote.shell.openExternal(Services.TikTokService.infoUrl);
}

function openApplicationInfoPage() {
  remote.shell.openExternal(Services.TikTokService.applicationUrl);
}

function openProducer() {
  const locale = Services.TikTokService.locale;
  remote.shell.openExternal(Services.TikTokService.legacyDashboardUrl);
}
