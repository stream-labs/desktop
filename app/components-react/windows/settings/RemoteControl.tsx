import React from 'react';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import { IConnectedDevice } from 'services/api/remote-control-api';
import styles from './RemoteControl.m.less';
import { useRealmObject } from 'components-react/hooks/realm';
import { useVuex } from 'components-react/hooks';

export function RemoteControlSettings() {
  const { RemoteControlService, UserService } = Services;

  const connectedDevices = useRealmObject(RemoteControlService.connectedDevices).devices;
  const enabled = useRealmObject(RemoteControlService.state).enabled;

  const { isLoggedIn } = useVuex(() => ({ isLoggedIn: UserService.views.isLoggedIn }));

  function handleToggle() {
    if (enabled) {
      RemoteControlService.actions.disconnect();
    } else {
      RemoteControlService.actions.createStreamlabsRemoteConnection();
    }
  }

  function disconnectDevice(device: IConnectedDevice) {
    RemoteControlService.actions.disconnectDevice(device.socketId);
  }

  return (
    <ObsSettingsSection>
      <div>
        {$t(
          'The free Streamlabs Controller app allows you to control Streamlabs Desktop from your iOS or Android device. You must be logged in to use this feature.',
        )}
        <br />
        <br />
      </div>

      <div>
        {isLoggedIn && (
          <SwitchInput
            label={$t('Allow remote connections')}
            onInput={handleToggle}
            value={enabled}
            layout="horizontal"
          />
        )}

        {enabled && (
          <div style={{ paddingBottom: 8 }}>
            <span>{$t('Connected Devices')}</span>
            {connectedDevices.length < 1 && (
              <span className={styles.whisper}>{$t('No devices connected')}</span>
            )}
            {connectedDevices.map(device => (
              <div className={styles.device}>
                <span>{device.deviceName}</span>
                <span className={styles.disconnect} onClick={() => disconnectDevice(device)}>
                  {$t('Disconnect')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ObsSettingsSection>
  );
}

RemoteControlSettings.page = 'Remote Control';
