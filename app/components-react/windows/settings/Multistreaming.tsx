import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import Translate from 'components-react/shared/Translate';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import * as remote from '@electron/remote';

export function MultistreamingSettings() {
  const { UserService, MagicLinkService } = Services;

  const { isLoggedIn, isPrime } = useVuex(() => ({
    isLoggedIn: UserService.views.isLoggedIn,
    isPrime: UserService.views.isPrime,
  }));

  async function upgradeToPrime() {
    MagicLinkService.linkToPrime('slobs-multistream');
  }

  const shouldShowPrime = isLoggedIn && !isPrime;

  return (
    <div>
      <ObsSettingsSection title={$t('Multistreaming')}>
        {shouldShowPrime ? (
          <div style={{ marginBottom: '16px' }}>
            <Translate message="Stream to multiple platforms at once with <ultra>Streamlabs Ultra</ultra>.">
              <u slot="ultra" />
            </Translate>
            <ButtonHighlighted
              onClick={upgradeToPrime}
              filled
              text={$t('Upgrade to Ultra')}
              icon={
                <UltraIcon
                  type="simple"
                  style={{
                    fill: '#09161D',
                    display: 'inline-block',
                    height: '12px',
                    width: '12px',
                    marginRight: '5px',
                  }}
                />
              }
            />
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
                <Translate
                  message={
                    'Step 2: Ensure the "Confirm stream title and game before going live" option is checked in the <general>General</general> settings tab."'
                  }
                >
                  <u slot="general" />
                </Translate>
              </li>
              <li>
                {$t('Step 3: Select which platforms you are streaming to when you hit "Go Live".')}
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
