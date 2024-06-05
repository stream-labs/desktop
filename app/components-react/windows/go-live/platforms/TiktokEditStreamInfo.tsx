import React from 'react';
import Form from '../../../shared/inputs/Form';
import { $t } from '../../../../services/i18n';
import { Services } from '../../../service-provider';
import { Button, Tooltip } from 'antd';
import InputWrapper from '../../../shared/inputs/InputWrapper';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import * as remote from '@electron/remote';
import { CommonPlatformFields } from '../CommonPlatformFields';
import { ITikTokStartStreamOptions } from 'services/platforms/tiktok';
import { TextInput, createBinding } from 'components-react/shared/inputs';
import InfoBanner from 'components-react/shared/InfoBanner';
import GameSelector from '../GameSelector';
import { EDismissable } from 'services/dismissables';

export function TikTokEditStreamInfo(p: IPlatformComponentParams<'tiktok'>) {
  const ttSettings = p.value;
  const approved = Services.TikTokService.scope === 'approved';
  const rejected = Services.TikTokService.rejected;

  function updateSettings(patch: Partial<ITikTokStartStreamOptions>) {
    p.onChange({ ...ttSettings, ...patch });
  }

  const bind = createBinding(ttSettings, updatedSettings => updateSettings(updatedSettings));

  return (
    <Form name="tiktok-settings">
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
        requiredFields={
          approved ? (
            <GameSelector key="required" platform={'tiktok'} {...bind.game} />
          ) : (
            <div key="empty-tiktok" />
          )
        }
      />

      {!approved && <TikTokEnterCredentialsFormInfo {...p} />}
      {rejected && <TikTokNotApprovedWarning {...p} />}
    </Form>
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
            <InfoBanner
              message={$t("Approvals are solely at TikTok's discretion.")}
              type="info"
              style={{ marginTop: '5px' }}
            />
          </div>
        }
      >
        <Button onClick={openProducer} style={{ marginBottom: '10px' }}>
          {$t('Locate my Stream Key')}
        </Button>
      </InputWrapper>
    </>
  );
}

export function TikTokNotApprovedWarning(p: IPlatformComponentParams<'tiktok'>) {
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InfoBanner
              message={$t('TikTok Live Access not granted. Click here to learn more.')}
              type="info"
              style={{ marginTop: '5px' }}
              onClick={() => {
                openConfirmation();
                Services.DismissablesService.actions.dismiss(EDismissable.TikTokRejected);
              }}
              dismissableKey={EDismissable.TikTokRejected}
            />
          </div>
        }
      >
        <Button
          onClick={openApplicationInfoPage}
          style={{
            marginBottom: '10px',
            background: 'var(--tiktok-btn)',
            color: 'var(--black)',
          }}
        >
          {$t('Reapply for TikTok Live Permission')}
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
  remote.shell.openExternal(Services.TikTokService.legacyDashboardUrl);
}

function openConfirmation() {
  remote.shell.openExternal(Services.TikTokService.confirmationUrl);
}
