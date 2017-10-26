import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { mutation, StatefulService, ServiceHelper } from './stateful-service';
import { SourcesService, ISource, Source } from './sources';
import { ScenesService } from './scenes';
import * as obs from '../../obs-api';
import Utils from './utils';
import electron from 'electron';
import { Inject } from '../util/injector';
import { InitAfter } from '../util/service-observer';
import { WindowsService } from './windows';
import {
  IBitmaskInput, IFormInput, IListInput, ISliderInputValue, TFormData,
  TObsValue
} from '../components/shared/forms/Input';

const { ipcRenderer } = electron;

export enum E_AUDIO_CHANNELS {
  OUTPUT_1 = 1,
  OUTPUT_2 = 2,
  INPUT_1 = 3,
  INPUT_2 = 4,
  INPUT_3 = 5,
}

const VOLMETER_UPDATE_INTERVAL = 100;

export interface IAudioSource {
  sourceId: string;
  fader: IFader;
  audioMixers: number;
  monitoringType: obs.EMonitoringType;
  forceMono: boolean;
  syncOffset: number;
}


export interface IAudioSourceApi extends IAudioSource {
  setDeflection(deflection: number): void;
  setMul(mul: number): void;
  setMuted(muted: boolean): void;
  subscribeVolmeter(cb: (volmeter: IVolmeter) => void): Subscription;
  getSettingsForm(): TFormData;
  setSettings(patch: Partial<IAudioSource>): void;
}


export interface IVolmeter {
  level: number;
  magnitude: number;
  peak: number;
  muted: boolean;
}

export interface IAudioDevice {
  id: string;
  description: string;
  type: 'input' | 'output';
}


interface IFader {
  db: number;
  deflection: number;
  mul: number;
}

interface IAudioSourcesState {
  audioSources: Dictionary<IAudioSource>;
}

export interface IAudioServiceApi {
  getDevices(): IAudioDevice[];
  getSource(sourceId: string): IAudioSourceApi;
  getSourcesForCurrentScene(): IAudioSourceApi[];
}


@InitAfter('SourcesService')
export class AudioService extends StatefulService<IAudioSourcesState> implements IAudioServiceApi {

  static initialState: IAudioSourcesState = {
    audioSources: {}
  };

  obsFaders: Dictionary<obs.IFader> = {};
  obsVolmeters: Dictionary<obs.IVolmeter> = {};

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;


  protected init() {

    this.sourcesService.sourceAdded.subscribe(sourceModel => {
      const source = this.sourcesService.getSource(sourceModel.sourceId);
      if (!source.audio) return;
      this.createAudioSource(source);
    });

    this.sourcesService.sourceUpdated.subscribe(source => {
      const audioSource = this.getSource(source.sourceId);
      if (!audioSource) return;

      if (!source.audio) {
        this.removeAudioSource(source.sourceId);
        return;
      }

    });

    this.sourcesService.sourceRemoved.subscribe(source => {
      if (source.audio) this.removeAudioSource(source.sourceId);
    });

  }


  static timeSpecToMs(timeSpec: obs.ITimeSpec): number {
    return timeSpec.sec * 1000 + Math.floor(timeSpec.nsec / 1000);
  }


  static msToTimeSpec(ms: number): obs.ITimeSpec {
    return {
      sec: Math.floor(ms / 1000),
      nsec: Math.floor(ms % 1000 * 1000)
    };
  }


  getSource(sourceId: string): AudioSource {
    return this.state.audioSources[sourceId] ? new AudioSource(sourceId) : void 0;
  }


  getSourcesForCurrentScene(): AudioSource[] {
    const scene = this.scenesService.activeScene;
    const sceneSources = scene.getNestedSources({ excludeScenes: true })
      .filter(sceneItem => sceneItem.audio);

    const globalSources = this.sourcesService.getSources().filter(source => source.channel !== void 0);
    return globalSources
      .concat(sceneSources)
      .map((sceneSource: ISource) => this.getSource(sceneSource.sourceId))
      .filter(item => item);
  }


  fetchAudioSource(sourceName: string): IAudioSource {
    const source = this.sourcesService.getSourceByName(sourceName);
    const obsSource = source.getObsInput();
    const obsFader = this.obsFaders[source.sourceId];

    const fader: IFader = {
      db: obsFader.db || 0,
      deflection: obsFader.deflection,
      mul: obsFader.mul,
    };

    return {
      sourceId: source.sourceId,
      fader,
      audioMixers: obsSource.audioMixers,
      monitoringType: obsSource.monitoringType,
      forceMono: !!(obsSource.flags & obs.ESourceFlags.ForceMono),
      syncOffset: AudioService.timeSpecToMs(obsSource.syncOffset)
    };
  }


  getDevices(): IAudioDevice[] {
    const devices: IAudioDevice[] = [];
    const obsAudioInput = obs.InputFactory.create('wasapi_input_capture', ipcRenderer.sendSync('getUniqueId'));
    const obsAudioOutput = obs.InputFactory.create('wasapi_output_capture', ipcRenderer.sendSync('getUniqueId'));

    (obsAudioInput.properties.get('device_id') as obs.IListProperty).details.items
      .forEach((item: { name: string, value: string}) => {
        devices.push({
          id: item.value,
          description: item.name,
          type: 'input'
        });
      });

    (obsAudioOutput.properties.get('device_id') as obs.IListProperty).details.items
      .forEach((item: { name: string, value: string}) => {
        devices.push({
          id: item.value,
          description: item.name,
          type: 'output'
        });
      });

    obsAudioInput.release();
    obsAudioOutput.release();
    return devices;
  }

  showAdvancedSettings() {
    this.windowsService.showWindow({
      componentName: 'AdvancedAudio',
      size: {
        width: 1150,
        height: 600
      }
    });
  }


  private createAudioSource(source: Source) {
    const obsVolmeter = obs.VolmeterFactory.create(obs.EFaderType.IEC);
    obsVolmeter.attach(source.getObsInput());
    this.obsVolmeters[source.sourceId] = obsVolmeter;

    const obsFader = obs.FaderFactory.create(obs.EFaderType.IEC);
    obsFader.attach(source.getObsInput());
    this.obsFaders[source.sourceId] = obsFader;

    this.ADD_AUDIO_SOURCE(this.fetchAudioSource(source.name));
  }

  private removeAudioSource(sourceId: string) {
    delete this.obsFaders[sourceId];
    delete this.obsVolmeters[sourceId];
    this.REMOVE_AUDIO_SOURCE(sourceId);
  }


  @mutation()
  private ADD_AUDIO_SOURCE(source: IAudioSource) {
    Vue.set(this.state.audioSources, source.sourceId, source);
  }


  @mutation()
  private REMOVE_AUDIO_SOURCE(sourceId: string) {
    Vue.delete(this.state.audioSources, sourceId);
  }
}

@ServiceHelper()
export class AudioSource implements IAudioSourceApi {
  name: string;
  sourceId: string;
  fader: IFader;
  muted: boolean;
  forceMono: boolean;
  audioMixers: number;
  monitoringType: obs.EMonitoringType;
  syncOffset: number;

  source: Source;

  @Inject()
  private audioService: AudioService;

  @Inject()
  private sourcesService: SourcesService;

  private audioSourceState: IAudioSource;

  constructor(sourceId: string) {
    this.audioSourceState = this.audioService.state.audioSources[sourceId];
    this.source = this.sourcesService.getSource(sourceId);
    Utils.applyProxy(this, this.audioSourceState);
    Utils.applyProxy(this, this.source.sourceState);
  }

  get displayName() {
    return this.source.displayName;
  }

  getSettingsForm(): TFormData {

    return [
      <ISliderInputValue>{
        name: 'deflection',
        value: Math.round(this.fader.deflection * 100),
        description: 'Volume (%)',
        showDescription: false,
        visible: true,
        enabled: true,
        minVal: 0,
        maxVal: 100,
        type: 'OBS_PROPERTY_INT'
      },

      <IFormInput<boolean>> {
        value: this.forceMono,
        name: 'forceMono',
        description: 'Downmix to Mono',
        showDescription: false,
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IFormInput<number>> {
        value: this.syncOffset,
        name: 'syncOffset',
        description: 'Sync Offset (ms)',
        showDescription: false,
        type: 'OBS_PROPERTY_INT',
        visible: true,
        enabled: true,
      },

      <IListInput<obs.EMonitoringType>> {
        value: this.monitoringType,
        name: 'monitoringType',
        description: 'Audio Monitoring',
        showDescription: false,
        type: 'OBS_PROPERTY_LIST',
        visible: true,
        enabled: true,
        options: [
          { value: obs.EMonitoringType.None, description: 'Monitor Off' },
          { value: obs.EMonitoringType.MonitoringOnly, description: 'Monitor Only (mute output)' },
          { value: obs.EMonitoringType.MonitoringAndOutput, description: 'Monitor and Output' }
        ]
      },


      <IBitmaskInput> {
        value: this.audioMixers,
        name: 'audioMixers',
        description: 'Tracks',
        showDescription: false,
        type: 'OBS_PROPERTY_BITMASK',
        visible: true,
        enabled: true,
        size: 6
      }
    ];
  }


  setSettings(patch: Partial<IAudioSource>) {
    const obsInput = this.source.getObsInput();

    Object.keys(patch).forEach(name => {
      const value = patch[name];
      if (value === void 0) return;

      if (name === 'deflection') {
        this.setDeflection(value / 100);
      } else if (name === 'syncOffset') {
        this.source.getObsInput().syncOffset = AudioService.msToTimeSpec(value);
      } else if (name === 'forceMono') {
        if (this.forceMono !== value) {
          value ?
            obsInput.flags = obsInput.flags | obs.ESourceFlags.ForceMono :
            obsInput.flags -= obs.ESourceFlags.ForceMono;
        }
      } else {
        obsInput[name] = value;
      }
    });
    this.UPDATE({ sourceId: this.sourceId, ...patch });
  }

  setDeflection(deflection: number) {
    const fader = this.audioService.obsFaders[this.sourceId];
    fader.deflection = deflection;
    this.UPDATE(this.audioService.fetchAudioSource(this.name));
  }


  setMul(mul: number) {
    const fader = this.audioService.obsFaders[this.sourceId];
    fader.mul = mul;
    this.UPDATE(this.audioService.fetchAudioSource(this.name));
  }


  setMuted(muted: boolean) {
    this.sourcesService.setMuted(this.sourceId, muted);
  }


  subscribeVolmeter(cb: (volmeter: IVolmeter) => void): Subscription {
    const volmeterStream = new Subject<IVolmeter>();

    let gotEvent = false;
    let lastVolmeterValue: IVolmeter;
    let volmeterCheckTimeoutId: number;
    const obsVolmeter = this.audioService.obsVolmeters[this.sourceId];
    obsVolmeter.updateInterval = VOLMETER_UPDATE_INTERVAL;
    const obsSubscription = obsVolmeter.addCallback(
      (level: number, magnitude: number, peak: number, muted: boolean) => {
        const volmeter: IVolmeter = { level, magnitude, peak, muted };

        if (muted) {
          volmeter.level = 0;
          volmeter.peak = 0;
        }

        volmeterStream.next(volmeter);
        lastVolmeterValue = volmeter;
        gotEvent = true;
      }
    );

    function volmeterCheck() {
      if (!gotEvent) {
        volmeterStream.next({ ...lastVolmeterValue, level: 0, peak: 0 });
      }

      gotEvent = false;
      volmeterCheckTimeoutId = window.setTimeout(volmeterCheck, VOLMETER_UPDATE_INTERVAL * 2);
    }

    volmeterCheck();

    return volmeterStream.subscribe(cb).add(() => {
      clearTimeout(volmeterCheckTimeoutId);
      obsVolmeter.removeCallback(obsSubscription);
    });
  }


  @mutation()
  private UPDATE(patch: { sourceId: string } & Partial<IAudioSource>) {
    Object.assign(this.audioSourceState, patch);
  }

}
