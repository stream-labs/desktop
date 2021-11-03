import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import uuid from 'uuid/v4';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core';
import { UsageStatisticsService } from 'services/usage-statistics';

export enum EDeviceType {
  audioInput = 'audioInput',
  audioOutput = 'audioOutput',
  videoInput = 'videoInput',
}

export interface IDevice {
  id: string;
  type: EDeviceType;
  description: string;
}

interface IOBSDevice {
  id: string;
  description: string;
}

export interface IHardwareServiceState {
  devices: IDevice[];
  dshowDevices: IDevice[]; // dhow_input operates with the different devices list
}

export class HardwareService extends StatefulService<IHardwareServiceState> {
  @Inject() usageStatisticsService: UsageStatisticsService;

  static initialState: IHardwareServiceState = {
    devices: [],
    dshowDevices: [],
  };

  init() {
    this.refreshDevices();

    this.usageStatisticsService.recordAnalyticsEvent('Hardware', {
      webcams: this.state.dshowDevices.map(d => d.description),
      microphones: this.state.devices
        .filter(d => d.type === 'audioInput' && d.id !== 'default')
        .map(d => d.description),
    });
  }

  getDevices() {
    return this.state.devices;
  }

  getDshowDevices() {
    return this.state.dshowDevices;
  }

  /**
   * Forces re-enumeration of hardware devices and refreshes the store
   * @param audioOnly Only refresh audio devices. This is a fast operation,
   * whereas fetching video as well can be a very slow operation.
   */
  refreshDevices(audioOnly = false) {
    this.SET_DEVICES(this.fetchDevices(audioOnly));
  }

  /**
   * Fetches hardware devices from OBS
   * @param audioOnly Only refresh audio devices. This is a fast operation,
   * whereas fetching video as well can be a very slow operation.
   * @returns all devices
   */
  private fetchDevices(audioOnly: boolean): IHardwareServiceState {
    const devices: IDevice[] = [];
    let dshowDevices: IDevice[] = [];

    (obs.NodeObs.OBS_settings_getInputAudioDevices() as IOBSDevice[]).forEach(device => {
      if (device.description === 'NVIDIA Broadcast') {
        this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualMic');
      }

      devices.push({
        id: device.id,
        description: device.description,
        type: EDeviceType.audioInput,
      });
    });

    (obs.NodeObs.OBS_settings_getOutputAudioDevices() as IOBSDevice[]).forEach(device => {
      devices.push({
        id: device.id,
        description: device.description,
        type: EDeviceType.audioOutput,
      });
    });

    if (audioOnly) {
      dshowDevices = this.state.dshowDevices;
    } else {
      (obs.NodeObs.OBS_settings_getVideoDevices() as IOBSDevice[]).forEach(device => {
        if (device.description === 'NVIDIA Broadcast') {
          this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualCam');
        }

        dshowDevices.push({
          id: device.id,
          description: device.description,
          type: EDeviceType.videoInput,
        });
      });
    }

    return { devices, dshowDevices };
  }

  @mutation()
  private SET_DEVICES(devices: IHardwareServiceState) {
    this.state.devices = devices.devices;
    this.state.dshowDevices = devices.dshowDevices;
  }
}
