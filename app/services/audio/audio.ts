import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { mutation, StatefulService, ServiceHelper } from 'services/stateful-service';
import { SourcesService, ISource, Source } from 'services/sources';
import { ScenesService } from 'services/scenes';
import * as obs from '../../../obs-api';
import Utils from 'services/utils';
import electron from 'electron';
import { Inject } from 'util/injector';
import { InitAfter } from 'util/service-observer';
import { WindowsService } from 'services/windows';
import {
  IObsBitmaskInput, IObsInput, IObsListInput, IObsNumberInputValue, TObsFormData,
} from 'components/obs/inputs/ObsInput';
import {
  IAudioDevice, IAudioServiceApi, IAudioSource, IAudioSourceApi, IAudioSourcesState, IFader,
  IVolmeter
} from './audio-api';
import { Observable } from 'rxjs/Observable';
import { $t } from 'services/i18n';
import uuid from 'uuid/v4';

const { ipcRenderer } = electron;

export enum E_AUDIO_CHANNELS {
  OUTPUT_1 = 1,
  OUTPUT_2 = 2,
  INPUT_1 = 3,
  INPUT_2 = 4,
  INPUT_3 = 5,
}

interface IAudioSourceData {
  fader?: obs.IFader;
  volmeter?: obs.IVolmeter;
  callbackInfo?: obs.ICallbackData;
  stream?: Observable<IVolmeter>;
}

@InitAfter('SourcesService')
export class AudioService extends StatefulService<IAudioSourcesState> implements IAudioServiceApi {

  static initialState: IAudioSourcesState = {
    audioSources: {}
  };


  sourceData: Dictionary<IAudioSourceData> = {};

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

      if (!audioSource && source.audio) {
        this.createAudioSource(this.sourcesService.getSource(source.sourceId));
      }

      if (audioSource && !source.audio) {
        this.removeAudioSource(source.sourceId);
      }
    });

    this.sourcesService.sourceRemoved.subscribe(source => {
      if (source.audio) this.removeAudioSource(source.sourceId);
    });

  }


  static timeSpecToMs(timeSpec: obs.ITimeSpec): number {
    return timeSpec.sec * 1000 + Math.floor(timeSpec.nsec / 1000000);
  }


  static msToTimeSpec(ms: number): obs.ITimeSpec {
    return {
      sec: Math.floor(ms / 1000),
      nsec: Math.floor(ms % 1000) * 1000000
    };
  }


  getSource(sourceId: string): AudioSource {
    return this.state.audioSources[sourceId] ? new AudioSource(sourceId) : void 0;
  }


  getSources(): AudioSource[] {
    return Object.keys(this.state.audioSources).map(sourceId => this.getSource(sourceId));
  }


  getSourcesForCurrentScene(): AudioSource[] {
    return this.getSourcesForScene(this.scenesService.activeSceneId);
  }


  getSourcesForScene(sceneId: string): AudioSource[] {
    const scene = this.scenesService.getScene(sceneId);
    const sceneSources = scene.getNestedSources({ excludeScenes: true })
      .filter(sceneItem => sceneItem.audio);

    const globalSources = this.sourcesService.getSources().filter(source => source.channel !== void 0);
    return globalSources
      .concat(sceneSources)
      .map((sceneSource: ISource) => this.getSource(sceneSource.sourceId))
      .filter(item => item);
  }

  unhideAllSourcesForCurrentScene() {
    this.getSourcesForCurrentScene().forEach(source => {
      source.setHidden(false);
    });
  }

  fetchFaderDetails(sourceId: string): IFader {
    const source = this.sourcesService.getSource(sourceId);
    const obsSource = source.getObsInput();
    const obsFader = this.sourceData[source.sourceId].fader;

    return {
      db: obsFader.db || 0,
      deflection: obsFader.deflection,
      mul: obsFader.mul,
    };
  }


  generateAudioSourceData(sourceId: string): IAudioSource {
    const source = this.sourcesService.getSource(sourceId);
    const obsSource = source.getObsInput();

    const fader = this.fetchFaderDetails(sourceId);

    return {
      sourceId: source.sourceId,
      fader,
      audioMixers: obsSource.audioMixers,
      monitoringType: obsSource.monitoringType,
      forceMono: !!(obsSource.flags & obs.ESourceFlags.ForceMono),
      syncOffset: AudioService.timeSpecToMs(obsSource.syncOffset),
      muted: obsSource.muted,
      resourceId: 'AudioSource' + JSON.stringify([sourceId]),
      mixerHidden: false
    };
  }


  getDevices(): IAudioDevice[] {
    const devices: IAudioDevice[] = [];
    const obsAudioInput = obs.InputFactory.create('wasapi_input_capture', uuid());
    const obsAudioOutput = obs.InputFactory.create('wasapi_output_capture', uuid());

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
        width: 1200,
        height: 600
      }
    });
  }


  private createAudioSource(source: Source) {
    this.sourceData[source.sourceId] = {};

    const obsVolmeter = obs.VolmeterFactory.create(obs.EFaderType.IEC);
    obsVolmeter.attach(source.getObsInput());
    this.sourceData[source.sourceId].volmeter = obsVolmeter;

    const obsFader = obs.FaderFactory.create(obs.EFaderType.IEC);
    obsFader.attach(source.getObsInput());
    this.sourceData[source.sourceId].fader = obsFader;

    this.initVolmeterStream(source.sourceId);
    this.ADD_AUDIO_SOURCE(this.generateAudioSourceData(source.sourceId));
  }

  private initVolmeterStream(sourceId: string) {
    const volmeterStream = new Subject<IVolmeter>();

    let gotEvent = false;
    let lastVolmeterValue: IVolmeter;
    let volmeterCheckTimeoutId: number;
    this.sourceData[sourceId].callbackInfo = this.sourceData[sourceId].volmeter.addCallback(
      (magnitude: number[], peak: number[], inputPeak: number[]) => {
        const volmeter: IVolmeter = { magnitude, peak, inputPeak };

        volmeterStream.next(volmeter);
        lastVolmeterValue = volmeter;
        gotEvent = true;
      }
    );

    /* This is useful for media sources since the volmeter will abruptly stop
     * sending events in the case of hiding the source. It might be better
     * to eventually just hide the mixer item as well though */
    function volmeterCheck() {
      if (!gotEvent) {
        volmeterStream.next({
          ...lastVolmeterValue,
          magnitude: [-Infinity],
          peak: [-Infinity],
          inputPeak: [-Infinity]
        });
      }

      gotEvent = false;
      volmeterCheckTimeoutId = window.setTimeout(volmeterCheck, 100);
    }

    volmeterCheck();

    this.sourceData[sourceId].stream = volmeterStream;
  }

  private removeAudioSource(sourceId: string) {
    this.sourceData[sourceId].volmeter.removeCallback(this.sourceData[sourceId].callbackInfo);
    delete this.sourceData[sourceId];
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
  resourceId: string;
  mixerHidden: boolean;

  @Inject()
  private audioService: AudioService;

  @Inject()
  private sourcesService: SourcesService;

  private audioSourceState: IAudioSource;

  constructor(sourceId: string) {
    this.audioSourceState = this.audioService.state.audioSources[sourceId];
    const sourceState = this.sourcesService.state.sources[sourceId];
    Utils.applyProxy(this, this.audioSourceState);
    Utils.applyProxy(this, sourceState);
  }

  getModel(): IAudioSource & ISource {
    return { ...this.source.sourceState, ...this.audioSourceState };
  }

  getSettingsForm(): TObsFormData {

    return [
      <IObsNumberInputValue>{
        name: 'deflection',
        value: Math.round(this.fader.deflection * 100),
        description: $t('Volume (%)'),
        showDescription: false,
        visible: true,
        enabled: true,
        minVal: 0,
        maxVal: 100,
        type: 'OBS_PROPERTY_INT'
      },

      <IObsInput<boolean>> {
        value: this.forceMono,
        name: 'forceMono',
        description: $t('Downmix to Mono'),
        showDescription: false,
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IObsInput<number>> {
        value: this.syncOffset,
        name: 'syncOffset',
        description: $t('Sync Offset (ms)'),
        showDescription: false,
        type: 'OBS_PROPERTY_INT',
        visible: true,
        enabled: true,
      },

      <IObsListInput<obs.EMonitoringType>> {
        value: this.monitoringType,
        name: 'monitoringType',
        description: $t('Audio Monitoring'),
        showDescription: false,
        type: 'OBS_PROPERTY_LIST',
        visible: true,
        enabled: true,
        options: [
          { value: obs.EMonitoringType.None, description: $t('Monitor Off') },
          { value: obs.EMonitoringType.MonitoringOnly, description: $t('Monitor Only (mute output)') },
          { value: obs.EMonitoringType.MonitoringAndOutput, description: $t('Monitor and Output') }
        ]
      },


      <IObsBitmaskInput> {
        value: this.audioMixers,
        name: 'audioMixers',
        description: $t('Tracks'),
        showDescription: false,
        type: 'OBS_PROPERTY_BITMASK',
        visible: true,
        enabled: true,
        size: 6
      }
    ];
  }

  get source() {
    return this.sourcesService.getSource(this.sourceId);
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
      } else if (name === 'muted') {
        this.setMuted(value);
      } else {
        obsInput[name] = value;
      }
    });
    this.UPDATE({ sourceId: this.sourceId, ...patch });
  }

  setDeflection(deflection: number) {
    const obsFader = this.audioService.sourceData[this.sourceId].fader;
    obsFader.deflection = deflection;

    const fader = this.audioService.fetchFaderDetails(this.sourceId);

    this.UPDATE({ sourceId: this.sourceId, fader });
  }


  setMul(mul: number) {
    const obsFader = this.audioService.sourceData[this.sourceId].fader;
    obsFader.mul = mul;

    const fader = this.audioService.fetchFaderDetails(this.sourceId);

    this.UPDATE({ sourceId: this.sourceId, fader });
  }


  setHidden(hidden: boolean) {
    this.UPDATE({ sourceId: this.sourceId, mixerHidden: hidden });
  }


  setMuted(muted: boolean) {
    this.sourcesService.setMuted(this.sourceId, muted);
  }


  subscribeVolmeter(cb: (volmeter: IVolmeter) => void): Subscription {
    const stream = this.audioService.sourceData[this.sourceId].stream;
    return stream.subscribe(cb);
  }


  @mutation()
  private UPDATE(patch: { sourceId: string } & Partial<IAudioSource>) {
    Object.assign(this.audioSourceState, patch);
  }

}
