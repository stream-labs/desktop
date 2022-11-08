import React from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import Translate from 'components-react/shared/Translate';
import * as remote from '@electron/remote';

export function MultistreamingSettings() {
  const { UserService, MagicLinkService } = Services;

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    remote.shell.openExternal(link);
  }

  const shouldShowPrime = UserService.views.isLoggedIn && !UserService.views.isPrime;

  // @@@ TODO: Add correct copy
  return (
    <div>
      <ObsSettingsSection title={$t('Multistreaming')}>
        {shouldShowPrime ? (
          <div style={{ marginBottom: '16px' }}>
            <a style={{ color: 'var(--prime)' }} onClick={upgradeToPrime}>
              <i style={{ color: 'var(--prime)' }} className="icon-prime" />
              {/* TODO: add to intl json */}
              {$t('Stream to multiple platforms with Prime')}
            </a>
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {/* TODO: add to intl json */}
            {$t('Go live on multiple platforms at once with Multistreaming.')}
            <ul>
              <li>
                <Translate message="Step 1: Connect your streaming accounts in the <connections>Connections</connections> settings">
                  <u slot="connections" />
                </Translate>
              </li>
              <li>
                {/* TODO: add to intl json */}
                {$t('Step 2: Select which platforms you are streaming to when you hit "Go Live"')}
              </li>
            </ul>
          </div>
        )}
      </ObsSettingsSection>
    </div>
  );
}

MultistreamingSettings.page = 'Multistreaming';
