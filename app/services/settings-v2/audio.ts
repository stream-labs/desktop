import { Inject, InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';

interface IAudioSettingsServiceState {
  disableAudioDucking: boolean;
  monitoringDevice: string;
}

const ADVANCED_PROPERTIES = ['monitoringDevice', 'disableAudioDucking'];

@InitAfter('UserService')
export class AudioSettingsService extends StatefulService<IAudioSettingsServiceState> {
  @Inject() settingsManagerService: SettingsManagerService;

  static initialState: IAudioSettingsServiceState = {
    disableAudioDucking: false,
    monitoringDevice: null,
  };

  init() {
    this.migrateSettings();
  }

  get advancedSettingsValues() {
    return {
      disableAudioDucking: this.state.disableAudioDucking,
      monitoringDevice: this.state.monitoringDevice,
    };
  }

  migrateSettings() {
    const advancedSettings = this.settingsManagerService.advancedAudioSettings;
    ADVANCED_PROPERTIES.forEach(property => {
      if (property === 'monitoringDevice') {
        this.setAdvancedValue(property, advancedSettings[property].id);
      } else {
        this.setAdvancedValue(property, advancedSettings[property]);
      }
    });
  }

  getMonitoringDeviceOptions() {
    const devices = obs.AudioFactory.monitoringDevices;
    return devices.map(device => ({ label: device.name, value: device.id }));
  }

  setAdvancedValue(key: string, val: boolean | string) {
    if (key === 'monitoringDevice') {
      const device = obs.AudioFactory.monitoringDevices.find(device => device.id === val) ?? {
        name: 'Default',
        id: 'default',
      };
      obs.AudioFactory[key] = device;
      this.SET_ADVANCED_VALUE(key, val);
    } else {
      obs.AudioFactory[key] = val;
      this.SET_ADVANCED_VALUE(key, val);
    }
  }

  @mutation()
  SET_ADVANCED_VALUE(key: string, val: unknown) {
    this.state[key] = val;
  }
}
