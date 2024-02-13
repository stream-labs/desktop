//TikTokEditStrean

import React, { useEffect } from 'react';
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
  const { TikTokService } = Services;
  const ttSettings = p.value;
  const liveStreamingEnabled = TikTokService.views.liveStreamingEnabled;

  const { locale, id } = TikTokService;

  function updateSettings(patch: Partial<ITikTokStartStreamOptions>) {
    p.onChange({ ...ttSettings, ...patch });
  }

  useEffect(() => {
    TikTokService.actions.validatePlatform();
  }, []);

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
        <TikTokStreamApplicationInfo ttId={id} locale={locale} />
      )}
    </Form>
  );
}

function openInfoPage() {
  remote.shell.openExternal(
    'https://streamlabs.com/content-hub/post/how-to-livestream-from-your-tiktok-account-using-streamlabs-from-web',
  );
}

function openApplicationInfoPage(id: string, locale: string) {
  remote.shell.openExternal(
    `https://www.tiktok.com/falcon/live_g/live_access_pc_apply/intro/index.html?${id}&lang=${locale}`,
  );
}

function TikTokStreamApplicationInfo(p: { ttId: string; locale: string }) {
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
          onClick={() => openApplicationInfoPage(p.ttId, p.locale)}
          style={{ marginBottom: '10px' }}
        >
          {$t('Apply for TikTok Live Permission')}
        </Button>
      </div>
    </InputWrapper>
  );
}
