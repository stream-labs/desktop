import React from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { CheckboxInput, ListInput, SliderInput } from '../../shared/inputs';
import { getDefined } from '../../../util/properties-type-guards';
import { ObsSettingsSection } from './ObsSettings';
import * as remote from '@electron/remote';
import { injectFormBinding, useModule } from 'slap';
import UltraIcon from 'components-react/shared/UltraIcon';

export function AppearanceSettings() {
  const { CustomizationService, WindowsService, UserService, MagicLinkService } = Services;

  const { bind } = useModule(() => {
    function getSettings() {
      return CustomizationService.state;
    }

    function setSettings(newSettings: typeof CustomizationService.state) {
      CustomizationService.actions.setSettings(newSettings);
    }

    return { bind: injectFormBinding(getSettings, setSettings) };
  });

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
    MagicLinkService.linkToPrime('slobs-ui-themes');
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
            <a onClick={upgradeToPrime}>
              <UltraIcon
                type={CustomizationService.isDarkTheme ? 'night' : 'day'}
                style={{
                  display: 'inline-block',
                  height: '12px',
                  width: '12px',
                  marginRight: '5px',
                }}
              />
              {$t('Change the look of Streamlabs Desktop with Ultra')}
            </a>
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Chat Settings')}>
        <CheckboxInput
          {...bind.leftDock}
          label={$t('Show the live dock (chat) on the left side')}
        />
        <SliderInput
          {...bind.chatZoomFactor}
          label={$t('Text Size')}
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

      <ObsSettingsSection>
        <CheckboxInput
          {...bind.enableAnnouncements}
          label={$t('Show announcements for new Streamlabs features and products')}
        />
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
