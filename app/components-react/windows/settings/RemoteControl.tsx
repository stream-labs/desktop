import React from 'react';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import { Services } from '../../service-provider';
import { SwitchInput } from '../../shared/inputs';
import { IConnectedDevice } from 'services/api/remote-control-api';
import styles from './RemoteControl.m.less';
import { useRealmObject } from 'components-react/hooks/realm';

export function RemoteControlSettings() {
  const { RemoteControlService } = Services;

  const connectedDevices = useRealmObject(RemoteControlService.connectedDevices).devices;
  const enabled = useRealmObject(RemoteControlService.state).enabled;

  function handleToggle() {
    if (enabled) {
      RemoteControlService.actions.disconnect();
    } else {
      RemoteControlService.actions.createStreamlabsRemoteConnection();
    }
  }

  function disconnectDevice(device: IConnectedDevice) {
    RemoteControlService.actions.disconnectDevice(device);
  }

  return (
    <ObsSettingsSection>
      <div>
        {$t(
          'The free Streamlabs Controller app allows you to control Streamlabs Desktop from your iOS or Android device. Scan the QR code below to begin.',
        )}
        <br />
        <br />
      </div>

      <div>
        <SwitchInput
          label={$t('Allow remote connections')}
          onInput={handleToggle}
          value={enabled}
        />

        {enabled && (
          <div>
            <span className={styles.whisper}>{$t('Connected Devices')}</span>
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
