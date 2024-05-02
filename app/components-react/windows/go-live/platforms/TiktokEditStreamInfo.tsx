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

export function TikTokEditStreamInfo(p: IPlatformComponentParams<'tiktok'>) {
  const ttSettings = p.value;
  const liveStreamingEnabled = Services.TikTokService.liveStreamingEnabled;
  const legacy = Services.TikTokService.scope === 'legacy';

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
        requiredFields={<div key="empty-tiktok" />}
        optionalFields={<TikTokGameSelector key="optional-tiktok" {...p} />}
      />

      {(!liveStreamingEnabled || legacy) && <TikTokEnterCredentialsFormInfo {...p} />}
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

function TikTokGameSelector(p: IPlatformComponentParams<'tiktok'>) {
  // const approved = Services.TikTokService.approved;
  // const denied = Services.TikTokService.denied;

  const approved = true;
  const denied = true;

  const bind = createBinding(p.value, updatedSettings =>
    p.onChange({ ...p.value, ...updatedSettings }),
  );

  // TODO: confirm the conditional logic to show this tooltip
  // In order to use the games list, the users must remerge their accounts
  // The tooltip should only show for users who are approved for live access but have not yet remerged.

  // Do not show game selector for legacy users because they do not have access to the API
  return (
    <div key="optional-tiktok-wrapper">
      {approved && (
        <GameSelector key="optional-tiktok-approved" platform={'tiktok'} {...bind.game} />
      )}

      {denied && (
        <GameSelector
          key="optional-tiktok-denied"
          platform={'tiktok'}
          {...bind.game}
          label={
            <Tooltip title={$t('Remerge TikTok account to access game list.')} placement="right">
              {/* TODO: the title prop above only accepts strings. We need to convert the below into a string in advance.
                 <Translate message="Remerge TikTok account to access game list. <link>Click here to remerge.</link>">
                    <a slot="link" onClick={openMergePage} />
                  </Translate> */}
              {$t('TikTok Game')}
              <i className="icon-information" style={{ marginLeft: '5px' }} />
            </Tooltip>
          }
        />
      )}

      {!approved && !denied && <div key="optional-tiktok-empty" />}
    </div>
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

function openMergePage() {
  remote.shell.openExternal(Services.TikTokService.mergeUrl);
}
