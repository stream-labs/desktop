import React, { CSSProperties } from 'react';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import { Services } from '../../service-provider';
import { SwitchInput, TextInput } from '../../shared/inputs';
import { Button, Col, Row, Space } from 'antd';
import Utils from '../../../services/utils';
import { injectState, mutation, useModule } from 'slap';
import { IConnectedDevice } from 'services/api/tcp-server';
import styles from './RemoteControl.m.less';

const QRCODE_SIZE = 350;

class RemoteControlModule {
  private get TcpServerService() {
    return Services.TcpServerService;
  }

  get connectedDevices() {
    return this.TcpServerService.state.remoteConnection.connectedDevices;
  }

  get remoteConnectionEnabled() {
    return this.TcpServerService.state.remoteConnection.enabled;
  }

  enableConnection() {
    this.TcpServerService.actions.createStreamlabsRemoteConnection();
  }

  disableConnection() {
    this.TcpServerService.actions.disableStreamlabsRemoteConnection();
  }

  disconnectDevice(device: IConnectedDevice) {
    const socket = this.TcpServerService.remoteSocket;
    if (socket) socket.emit('disconnectDevice', { socketId: device.socketId });
  }
}

export function RemoteControlSettings() {
  const {
    connectedDevices,
    remoteConnectionEnabled,
    enableConnection,
    disableConnection,
    disconnectDevice,
  } = useModule(RemoteControlModule);

  function handleToggle() {
    if (remoteConnectionEnabled) {
      disableConnection();
    } else {
      enableConnection();
    }
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
        <SwitchInput label={$t('Allow remote connections')} onInput={handleToggle} />

        {remoteConnectionEnabled && (
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
