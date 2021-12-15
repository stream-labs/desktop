import React from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import electron from 'electron';
import { useBinding } from '../../store';
import { CheckboxInput, ListInput, SliderInput } from '../../shared/inputs';
import { getDefined } from '../../../util/properties-type-guards';
import { ObsSettingsSection } from './ObsSettings';
import { cloneDeep } from 'lodash';

export function AppearanceSettings() {
  const { CustomizationService, WindowsService, UserService, MagicLinkService } = Services;

  const bind = useBinding(
    () => cloneDeep(CustomizationService.state),
    newSettings => {
      CustomizationService.actions.setSettings(newSettings);
    },
  );

  function openFFZSettings() {
    WindowsService.createOneOffWindow(
      {
        componentName: 'FFZSettings',
        title: $t('FrankerFaceZ Settings'),
        queryParams: {},
        size: {
          width: 800,
          height: 800,
        },
      },
      'ffz-settings',
    );
  }

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    electron.remote.shell.openExternal(link);
  }

  const shouldShowPrime = UserService.views.isLoggedIn && !UserService.views.isPrime;
  const shouldShowEmoteSettings =
    UserService.views.isLoggedIn && getDefined(UserService.platform).type === 'twitch';

  return (
    <div>
      <ObsSettingsSection>
        <ListInput {...bind.theme} label={'Theme'} options={CustomizationService.themeOptions} />
        {shouldShowPrime && (
          <div style={{ marginBottom: '16px' }}>
            <a style={{ color: 'var(--prime)' }} onClick={upgradeToPrime}>
              <i style={{ color: 'var(--prime)' }} className="icon-prime" />
              {$t('Change the look of Streamlabs Desktop with Prime')}
            </a>
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection>
        <ListInput
          {...bind.folderSelection}
          label={$t('Scene item selection mode')}
          options={[
            { value: true, label: $t('Single click selects group. Double click selects item') },
            {
              value: false,
              label: $t('Double click selects group. Single click selects item'),
            },
          ]}
        />
        <CheckboxInput
          {...bind.leftDock}
          label={$t('Show the live dock (chat) on the left side')}
        />
        <SliderInput
          {...bind.chatZoomFactor}
          label={$t('Chat Text Size')}
          tipFormatter={(val: number) => `${val * 100}%`}
          min={0.25}
          max={2}
          step={0.25}
        />

        {shouldShowEmoteSettings && (
          <div>
            <CheckboxInput
              {...bind.enableBTTVEmotes}
              label={$t('Enable BetterTTV emotes for Twitch')}
            />
            <CheckboxInput
              {...bind.enableFFZEmotes}
              label={$t('Enable FrankerFaceZ emotes for Twitch')}
            />
          </div>
        )}
      </ObsSettingsSection>

      {bind.enableFFZEmotes.value && (
        <div className="section">
          <button className="button button--action" onClick={openFFZSettings}>
            {$t('Open FrankerFaceZ Settings')}
          </button>
        </div>
      )}
    </div>
  );
}

AppearanceSettings.page = 'Appearance';
