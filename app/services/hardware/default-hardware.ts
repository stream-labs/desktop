import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { EDeviceType, HardwareService } from './hardware';
import { Inject } from 'services/core/injector';
import { AudioService } from 'services/audio';
import { SourcesService, ISourceAddOptions } from 'services/sources';
import { mutation } from 'services/core';

interface IDefaultHardwareServiceState {
  defaultVideoDevice: string;
  defaultAudioDevice: string;
}

export class DefaultHardwareService extends PersistentStatefulService<
  IDefaultHardwareServiceState
> {
  static defaultState: IDefaultHardwareServiceState = {
    defaultVideoDevice: null,
    defaultAudioDevice: 'default',
  };

  @Inject() private hardwareService: HardwareService;
  @Inject() private audioService: AudioService;
  @Inject() private sourcesService: SourcesService;

  init() {
    super.init();
  }

  createTemporarySources() {
    this.audioDevices.forEach(device => {
      this.sourcesService.createSource(
        device.id,
        'wasapi_input_capture',
        { device_id: device.id },
        {
          isTemporary: true,
          sourceId: device.id,
        } as ISourceAddOptions,
      );
    });

    this.videoDevices.forEach(device => {
      const existingSource = this.existingVideoDeviceSources.find(
        source => source.deviceId === device.id,
      );
      if (existingSource) return;
      this.sourcesService.createSource(device.id, 'dshow_input', { video_device_id: device.id }, {
        isTemporary: true,
        sourceId: device.id,
      } as ISourceAddOptions);
    });
  }

  get existingVideoDeviceSources() {
    return this.sourcesService.sources
      .filter(
        source =>
          this.videoDevices.find(device => device.id === source.getSettings().video_device_id) &&
          source.type === 'dshow_input',
      )
      .map(source => ({ source, deviceId: source.getSettings().video_device_id }));
  }

  clearTemporarySources() {
    this.audioDevices.forEach(device => {
      this.sourcesService.removeSource(device.id);
    });

    this.videoDevices.forEach(device => {
      const existingSource = this.existingVideoDeviceSources.find(
        source => source.deviceId === device.id,
      );
      if (existingSource) return;
      this.sourcesService.removeSource(device.id);
    });
  }

  get videoDevices() {
    return this.hardwareService
      .getDshowDevices()
      .filter(device => EDeviceType.videoInput === device.type);
  }

  get audioDevices() {
    return this.audioService.getDevices().filter(device => device.type === EDeviceType.audioInput);
  }

  get selectedAudioSource() {
    if (!this.state.defaultAudioDevice) return;
    return this.audioService.getSource(this.state.defaultAudioDevice);
  }

  get selectedVideoSource() {
    if (!this.state.defaultVideoDevice) return;
    const existingSource = this.existingVideoDeviceSources.find(
      source => source.deviceId === this.state.defaultVideoDevice,
    );
    if (existingSource) return existingSource.source;
    return this.sourcesService.getSource(this.state.defaultVideoDevice);
  }

  videoSourceExists(id: string) {
    const existingSource = this.existingVideoDeviceSources.find(source => source.deviceId === id);
    const tempSource = this.sourcesService.getSource(id);
    return existingSource || tempSource;
  }

  setDefault(type: 'audio' | 'video', id: string) {
    if (type === 'video' && !this.videoSourceExists(id)) {
      throw new Error('Device Unavailable');
    }
    this.SET_DEVICE(type, id);
  }

  @mutation()
  private SET_DEVICE(type: string, id: string) {
    if (type === 'video') {
      this.state.defaultVideoDevice = id;
    } else {
      this.state.defaultAudioDevice = id;
    }
  }
}
