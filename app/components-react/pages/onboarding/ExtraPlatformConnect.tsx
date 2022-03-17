import { useModule } from 'components-react/hooks/useModule';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import React, { useState } from 'react';
import { $t } from 'services/i18n';
import { LoginModule } from './Connect';
import styles from './Connect.m.less';
import * as remote from '@electron/remote';
import { TextInput } from 'components-react/shared/inputs/TextInput';
import { OnboardingModule } from './Onboarding';
import { Services } from 'components-react/service-provider';

export function ExtraPlatformConnect() {
  const { selectedExtraPlatform, setExtraPlatform } = useModule(LoginModule).select();
  const { next } = useModule(OnboardingModule).select();
  const [key, setKey] = useState('');

  if (!selectedExtraPlatform) return <div></div>;

  function openHelp() {
    remote.shell.openExternal(platformDefinition.helpUrl);
  }

  function onFinish() {
    Services.StreamSettingsService.setSettings({
      key,
      streamType: 'rtmp_custom',
      server: platformDefinition.ingestUrl,
    });
    next();
  }

  const platformDefinition = {
    dlive: {
      name: 'DLive',
      ingestUrl: 'rtmp://stream.dlive.tv/live',
      helpUrl: 'https://go.dlive.tv/stream',
      icon: 'dlive-white.png',
    },
    nimotv: {
      name: 'Nimo.TV',
      ingestUrl: 'rtmp://txpush.rtmp.nimo.tv/live/',
      helpUrl: 'https://article.nimo.tv/p/1033/streamlabsprotocol.html',
      icon: 'nimo-logo.png',
    },
  }[selectedExtraPlatform];

  return (
    <div>
      <div className={styles.container} style={{ height: '50%' }}>
        <p>
          <PlatformLogo platform={selectedExtraPlatform} />
        </p>
        <h1>{$t('Connect to %{platform}', { platform: platformDefinition.name })}</h1>
        <p>
          {$t('Enter your stream key.')}
          &nbsp;
          <span className={styles['link-button']} onClick={openHelp}>
            {$t('View help docs')}
          </span>
        </p>

        <div className="section">
          <TextInput label={$t('Stream Key')} value={key} onChange={setKey} />
        </div>

        {!!key.trim().length && (
          <p>
            <button className={`button button--${selectedExtraPlatform}`} onClick={onFinish}>
              {$t('Finish')}
            </button>
          </p>
        )}

        <p>
          <a className={styles['link-button']} onClick={next}>
            {$t('Skip')}
          </a>

          <span style={{ display: 'inline-block', width: 32 }}> </span>

          <a className={styles['link-button']} onClick={() => setExtraPlatform(undefined)}>
            {$t('Back')}
          </a>
        </p>
      </div>
    </div>
  );
}
