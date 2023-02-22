import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import { $t } from 'services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import { RadioInput, SwitchInput } from 'components-react/shared/inputs';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Translate from 'components-react/shared/Translate';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import Tooltip from 'components-react/shared/Tooltip';
import { message } from 'antd';
import { TPlatform } from 'services/platforms';
import {
  IDualOutputPlatformSetting,
  displayLabels,
  TDualOutputDisplayType,
  platformLabels,
} from '../../../services/dual-output';
import styles from './Multistreaming.m.less';

export function MultistreamingSettings() {
  const { UserService, MagicLinkService, DualOutputService } = Services;

  const v = useVuex(() => ({
    isLoggedIn: UserService.views.isLoggedIn,
    isPrime: UserService.views.isPrime,
    platformSettingsList: DualOutputService.views.platformSettingsList,
    updatePlatformSetting: DualOutputService.actions.updatePlatformSetting,
  }));

  async function upgradeToPrime() {
    MagicLinkService.linkToPrime('slobs-multistream');
  }

  const shouldShowPrime = v.isLoggedIn && !v.isPrime;

  const dualOutputSettings = [
    {
      label: displayLabels('horizontal') ?? 'Horizontal',
      value: 'horizontal',
    },
    {
      label: displayLabels('vertical') ?? 'Vertical',
      value: 'vertical',
    },
  ];

  return (
    <div className="multistreaming-wrapper">
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
          <div className={styles.wrapper}>
            {$t('Go live on multiple platforms at once with Multistreaming.')}
            <ul>
              <li>
                <Translate message="Step 1: Connect your streaming accounts in the <stream>Stream</stream> settings.">
                  <u slot="stream" />
                </Translate>
              </li>
              <li>
                <Translate
                  // ignore \" for intl translation
                  // prettier-ignore
                  message={
                    'Step 2: Ensure the \"Confirm stream title and game before going live\" option is checked in the <general>General</general> settings tab."'
                  }
                >
                  <u slot="general" />
                </Translate>
              </li>
              <li>
                {
                  // ignore \" for intl translation
                  // prettier-ignore
                  $t('Step 3: Select which platforms you are streaming to when you hit \"Go Live\".')
                }
              </li>
            </ul>
          </div>
        )}
      </ObsSettingsSection>
      <ObsSettingsSection title={$t('Dual Output')} style={{ paddingBottom: '30px' }}>
        <div className={styles.doSettings}>
          <div className={styles.doDescription}>
            {$t('Set your default output mode for each platform.')}{' '}
            <Tooltip
              title={$t('You can select which one to stream with in the Go Live window.')}
              className={styles.doTooltip}
              placement="top"
              lightShadow
            >
              <i className="icon-information" />
            </Tooltip>
          </div>

          {v.platformSettingsList.map((option: IDualOutputPlatformSetting) => (
            <div key={option.platform} className={styles.doPlatformSettings}>
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
                onChange={val =>
                  v.updatePlatformSetting(option.platform, val as TDualOutputDisplayType)
                }
                value={option.display}
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
    <div className={styles.doSettingsWrapper}>
      <PlatformLogo platform={p.platform as TPlatform} size="small" />
      <span className={styles.doSettingsLabel}>{p.label}</span>
      <span className={styles.modeLabel}>{$t('Mode:')}</span>
    </div>
  );
}

MultistreamingSettings.page = 'Multistreaming';
