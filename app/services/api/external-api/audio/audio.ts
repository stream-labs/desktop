import {
  AudioSource as InternalAudioSource,
  AudioService as InternalAudioService,
} from 'services/audio';
import { Inject } from 'util/injector';
import { Singleton } from 'services/api/external-api';
import { ServiceHelper } from 'services/stateful-service';
import { ISerializable } from '../../rpc-api';
import * as obs from '../../../../../obs-api';

@Singleton()
export class AudioService {
  @Inject() protected audioService: InternalAudioService;

  getSource(sourceId: string): AudioSource {
    const source = this.audioService.getSource(sourceId);
    return source ? new AudioSource(sourceId) : null;
  }

  getSources(): AudioSource[] {
    return this.audioService.getSources().map(source => this.getSource(source.sourceId));
  }

  getSourcesForCurrentScene(): AudioSource[] {
    return this.audioService
      .getSourcesForCurrentScene()
      .map(source => this.getSource(source.sourceId));
  }

  getSourcesForScene(sceneId: string): AudioSource[] {
    return this.audioService
      .getSourcesForScene(sceneId)
      .map(source => this.getSource(source.sourceId));
  }
}

export interface IFader {
  db: number;
  deflection: number;
  mul: number;
}

export interface IAudioSourceModel {
  sourceId: string;
  fader: IFader;
  audioMixers: number;
  monitoringType: obs.EMonitoringType;
  forceMono: boolean;
  syncOffset: number;
  muted: boolean;
  mixerHidden: boolean;
}

@ServiceHelper()
export class AudioSource implements ISerializable {
  @Inject() private audioService: InternalAudioService;
  private audioSource: InternalAudioSource;

  constructor(private sourceId: string) {
    this.audioSource = this.audioService.getSource(sourceId);
  }

  /**
   * serialize source
   */
  getModel(): IAudioSourceModel {
    return {
      sourceId: this.audioSource.sourceId,
      fader: this.audioSource.fader,
      audioMixers: this.audioSource.audioMixers,
      monitoringType: this.audioSource.monitoringType,
      forceMono: this.audioSource.forceMono,
      syncOffset: this.audioSource.syncOffset,
      muted: this.audioSource.muted,
      mixerHidden: this.audioSource.mixerHidden,
    };
  }

  setDeflection(deflection: number) {
    return this.audioSource.setDeflection(deflection);
  }

  setMuted(muted: boolean) {
    return this.audioSource.setMuted(muted);
  }
}
