import { mutation, StatefulService } from '../stateful-service';
import * as obs from '../../../obs-api';
import uuid from 'uuid/v4';

export enum EDeviceType {
  audioInput = 'audioInput',
  audioOutput = 'audioOutput',
  videoInput = 'videoInput'
}

export interface IDevice {
  id: string;
  type: EDeviceType;
  description: string;
}

export interface IHardwareServiceState {
  devices: IDevice[];
}

export class HardwareService extends StatefulService<IHardwareServiceState> {

  static initialState: IHardwareServiceState = {
    devices: []
  };

  init() {
    this.SET_DEVICES(this.fetchDevices());
  }

  getDevices() {
    return this.state.devices;
  }

  getDevice(id: string) {
    return this.state.devices.find(device => device.id == id);
  }

  getDeviceByName(name: string) {
    return this.state.devices.find(device => device.description == name);
  }

  private fetchDevices(): IDevice[] {
    const devices: IDevice[] = [];
    const obsAudioInput = obs.InputFactory.create('wasapi_input_capture', uuid());
    const obsAudioOutput = obs.InputFactory.create('wasapi_output_capture', uuid());
    const obsVideoInput = obs.InputFactory.create('dshow_input', uuid());

    (obsAudioInput.properties.get('device_id') as obs.IListProperty).details.items
      .forEach((item: { name: string, value: string}) => {
        devices.push({
          id: item.value,
          description: item.name,
          type: EDeviceType.audioInput
        });
      });

    (obsAudioOutput.properties.get('device_id') as obs.IListProperty).details.items
      .forEach((item: { name: string, value: string}) => {
        devices.push({
          id: item.value,
          description: item.name,
          type: EDeviceType.audioOutput
        });
      });

    (obsVideoInput.properties.get('video_device_id') as obs.IListProperty).details.items
      .forEach((item: { name: string, value: string}) => {
        devices.push({
          id: item.value,
          description: item.name,
          type: EDeviceType.videoInput
        });
      });

    obsAudioInput.release();
    obsAudioOutput.release();
    obsVideoInput.release();
    return devices;
  }

  @mutation()
  private SET_DEVICES(devices: IDevice[]) {
    this.state.devices = devices;
  }
}
