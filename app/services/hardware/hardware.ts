import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import uuid from 'uuid/v4';
import { byOS, OS } from 'util/operating-systems';
import { Inject } from 'services/core';
import { UsageStatisticsService } from 'services/usage-statistics';
import { wrapMeasure } from 'util/performance';

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
  }

  getDevices() {
    return this.state.devices;
  }

  getDshowDevices() {
    return this.state.dshowDevices;
  }

  /**
   * Forces re-enumeration of hardware devices and refreshes the store
   */
  refreshDevices() {
    this.SET_DEVICES(this.fetchDevices());
  }

  private fetchDevices(): IHardwareServiceState {
    const devices: IDevice[] = [];
    const dshowDevices: IDevice[] = [];

    let audioInput: IOBSDevice[];
    let audioOutput: IOBSDevice[];
    let video: IOBSDevice[];

    wrapMeasure('OBS_settings_getInputAudioDevices', () => {
      audioInput = obs.NodeObs.OBS_settings_getInputAudioDevices();
    });

    wrapMeasure('OBS_settings_getOutputAudioDevices', () => {
      audioOutput = obs.NodeObs.OBS_settings_getInputAudioDevices();
    });

    wrapMeasure('OBS_settings_getVideoDevices', () => {
      video = obs.NodeObs.OBS_settings_getVideoDevices();
    });

    audioInput.forEach(device => {
      if (device.description === 'NVIDIA Broadcast') {
        this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualMic');
      }

      devices.push({
        id: device.id,
        description: device.description,
        type: EDeviceType.audioInput,
      });
    });

    audioOutput.forEach(device => {
      devices.push({
        id: device.id,
        description: device.description,
        type: EDeviceType.audioOutput,
      });
    });

    video.forEach(device => {
      if (device.description === 'NVIDIA Broadcast') {
        this.usageStatisticsService.recordFeatureUsage('NvidiaVirtualCam');
      }

      dshowDevices.push({
        id: device.id,
        description: device.description,
        type: EDeviceType.videoInput,
      });
    });

    return { devices, dshowDevices };
  }

  @mutation()
  private SET_DEVICES(devices: IHardwareServiceState) {
    this.state.devices = devices.devices;
    this.state.dshowDevices = devices.dshowDevices;
  }
}
