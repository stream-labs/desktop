import React from 'react';
import { $t } from '../../../services/i18n';
import { useBinding } from '../../store';
import { Services } from '../../service-provider';
import { cloneDeep } from 'lodash';
import { ObsSettingsSection } from './ObsSettings';
import { CheckboxInput, SliderInput, SwitchInput } from '../../shared/inputs';

export function NotificationsSettings() {
  const { NotificationsService, TroubleshooterService } = Services;

  function restoreDefaults() {
    NotificationsService.actions.restoreDefaultSettings();
    TroubleshooterService.actions.restoreDefaultSettings();
  }

  function showNotifications() {
    NotificationsService.actions.showNotifications();
  }

  const bindNotifications = useBinding(
    () => cloneDeep(NotificationsService.state.settings),
    updatedSettings => NotificationsService.actions.setSettings(updatedSettings),
  );

  const bindTroubleshooter = useBinding(
    () => cloneDeep(TroubleshooterService.state.settings),
    updatedSettings => TroubleshooterService.actions.setSettings(updatedSettings),
  );

  return (
    <div>
      <div className="section">
        <button className="button button--action" onClick={showNotifications}>
          {$t('Show Notifications')}
        </button>
        <button className="button button--soft-warning" onClick={restoreDefaults}>
          {$t('Restore Defaults')}
        </button>
      </div>

      <ObsSettingsSection>
        <SwitchInput {...bindNotifications.enabled} label={$t('Enable notifications')} />
        {bindNotifications.enabled.value && (
          <CheckboxInput {...bindNotifications.playSound} label={$t('Enable sound')} />
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Troubleshooter Notifications')}>
        <SwitchInput label={$t('Detect skipped frames')} {...bindTroubleshooter.skippedEnabled} />
        {bindTroubleshooter.skippedEnabled.value && (
          <SliderInput
            {...bindTroubleshooter.skippedThreshold}
            label={$t('Skipped frames threshold')}
            min={0}
            max={1}
            step={0.01}
          />
        )}

        <SwitchInput label={$t('Detect lagged frames')} {...bindTroubleshooter.laggedEnabled} />
        {bindTroubleshooter.laggedEnabled.value && (
          <SliderInput
            {...bindTroubleshooter.laggedThreshold}
            label={$t('Lagged frames threshold')}
            min={0}
            max={1}
            step={0.01}
          />
        )}

        <SwitchInput label={$t('Detect lagged frames')} {...bindTroubleshooter.droppedEnabled} />
        {bindTroubleshooter.droppedEnabled.value && (
          <SliderInput
            {...bindTroubleshooter.droppedThreshold}
            label={$t('Dropped frames threshold')}
            min={0}
            max={1}
            step={0.01}
          />
        )}
      </ObsSettingsSection>
    </div>
  );
}

NotificationsSettings.page = 'Notifications';
