import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import { $t } from 'services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import { Tooltip } from 'antd';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Translate from 'components-react/shared/Translate';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import { TPlatform } from 'services/platforms';
import {
  IDualOutputPlatformSetting,
  // dualOutputSettings,
  settingLabels,
  EDualOutputPlatform,
  TOutputDisplayType,
  platformLabels,
} from '../../../services/dual-output';
import * as remote from '@electron/remote';

export function MultistreamingSettings() {
  const { UserService, MagicLinkService, DualOutputService } = Services;

  const { isLoggedIn, isPrime, platformSettingsList, updatePlatformSetting } = useVuex(() => ({
    isLoggedIn: UserService.views.isLoggedIn,
    isPrime: UserService.views.isPrime,
    platformSettingsList: DualOutputService.views.platformSettingsList,
    updatePlatformSetting: DualOutputService.actions.updatePlatformSetting,
  }));

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    remote.shell.openExternal(link);
  }

  const shouldShowPrime = isLoggedIn && !isPrime;

  const dualOutputSettings = [
    {
      label:
        settingLabels(TOutputDisplayType.Horizontal) ?? (TOutputDisplayType.Horizontal as string),
      value: TOutputDisplayType.Horizontal as string,
    },
    {
      label: settingLabels(TOutputDisplayType.Vertical) ?? (TOutputDisplayType.Vertical as string),
      value: TOutputDisplayType.Vertical as string,
    },
  ];

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
                {/* eslint-disable-next-line no-useless-escape */}
                <Translate
                  message={
                    'Step 2: Ensure the \"Confirm stream title and game before going live\" option is checked in the <general>General</general> settings tab."'
                  }
                >
                  <u slot="general" />
                </Translate>
              </li>
              <li>
                {/* eslint-disable-next-line no-useless-escape */}
                {$t('Step 3: Select which platforms you are streaming to when you hit \"Go Live\".')}
              </li>
            </ul>
          </div>
        )}
      </ObsSettingsSection>
      <ObsSettingsSection title={$t('Dual Output')} style={{ paddingBottom: '24px' }}>
        <div className="do-description" style={{ marginBottom: '12px' }}>
          {/* @@@ TODO: Add toggle */}
          {$t('Enable Dual Outputs (simultaneous horizontal and vertical Outputs)')}{' '}
          <Tooltip title={'Temp Tooltip Text 1'}>
            <i className="icon-information" />
          </Tooltip>
        </div>

        <div className="do-settings" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: '12px' }}>{$t('Dual Output Settings')}</h2>
          <div className="do-description" style={{ marginBottom: '12px' }}>
            {$t('Set your default output mode for each platform.')}{' '}
            <Tooltip title={'Temp Tooltip Text 2'}>
              <i className="icon-information" />
            </Tooltip>
          </div>

          {platformSettingsList.map((option: IDualOutputPlatformSetting) => (
            <div
              key={option.platform}
              className="do-platform-settings"
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
            >
              <DualOutputSettingsLabel
                label={(platformLabels(option.platform) ?? option.platform) as string}
                platform={option.platform}
              />
              <RadioInput
                label={(platformLabels(option.platform) ?? option.platform) as string}
                direction="horizontal"
                nolabel
                nomargin
                defaultValue="horizontal"
                options={dualOutputSettings}
                onChange={val => updatePlatformSetting(option.platform, val as TOutputDisplayType)}
                value={option.setting}
              />
            </div>
          ))}
        </div>
      </ObsSettingsSection>
    </div>
  );
}

function DualOutputSettingsLabel(p: { label: string; platform: string }) {
  return (
    <div
      className="do-settings-wrapper"
      style={{ display: 'flex', width: '200px', alignItems: 'center' }}
    >
      <PlatformLogo platform={p.platform as TPlatform} size="small" />
      <span className="do-settings-label" style={{ flexGrow: 1, marginLeft: '10px' }}>
        {p.label}
      </span>
      <span className="mode" style={{ justifySelf: 'flex-end', marginRight: '30px' }}>
        {$t('Mode:')}
      </span>
    </div>
  );
}

MultistreamingSettings.page = 'Multistreaming';
