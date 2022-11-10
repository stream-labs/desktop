import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import Translate from 'components-react/shared/Translate';
import * as remote from '@electron/remote';

export function MultistreamingSettings() {
  const { UserService, MagicLinkService } = Services;

  const { isLoggedIn, isPrime } = useVuex(() => ({
    isLoggedIn: UserService.views.isLoggedIn,
    isPrime: UserService.views.isPrime,
  }));

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    remote.shell.openExternal(link);
  }

  const shouldShowPrime = isLoggedIn && !isPrime;

  return (
    <div>
      <ObsSettingsSection title={$t('Multistreaming')}>
        {shouldShowPrime ? (
          <div style={{ marginBottom: '16px' }}>
            <a style={{ color: 'var(--prime)' }} onClick={upgradeToPrime}>
              <i style={{ color: 'var(--prime)' }} className="icon-prime" />
              {$t('Stream to multiple platforms with Prime')}
            </a>
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {$t('Go live on multiple platforms at once with Multistreaming.')}
            <ul>
              <li>
                <Translate message="Step 1: Connect your streaming accounts in the <stream>Stream</stream> settings.">
                  <u slot="stream" />
                </Translate>
              </li>
              <li>
                {/* eslint-disable-next-line no-useless-escape */}
                <Translate
                  message={
                    'Step 2: Ensure the \"Confirm stream title and game before going live\" option is checked in the <general>General</general> settings tab."'
                  }
                >
                  <u slot="general" />
                </Translate>
                {/* {$t('Step 2: Ensure the \"Confirm stream title and game before going live\" option is checked in the General settings tab.')} */}
              </li>
              <li>
                {/* eslint-disable-next-line no-useless-escape */}
                {$t('Step 3: Select which platforms you are streaming to when you hit \"Go Live\".')}
              </li>
            </ul>
          </div>
        )}
      </ObsSettingsSection>
      <ObsSettingsSection
        title={$t('New features coming soon!')}
        style={{ paddingBottom: '24px' }}
      ></ObsSettingsSection>
    </div>
  );
}

MultistreamingSettings.page = 'Multistreaming';
