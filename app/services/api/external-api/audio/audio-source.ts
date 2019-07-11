import { ServiceHelper, Inject } from 'services';
import { ISerializable } from 'services/api/rpc-api';
import {
  AudioService as InternalAudioService,
  AudioSource as InternalAudioSource,
} from 'services/audio';
import { SourcesService as InternalSourcesService } from 'services/sources';
import { Fallback } from 'services/api/external-api';
import * as obs from '../../../../../obs-api';

export interface IFader {
  db: number;
  deflection: number;
  mul: number;
}

export interface IAudioSourceModel {
  sourceId: string;
  name: string;
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
  @Inject() private sourcesService: InternalSourcesService;
  @Fallback() private audioSource: InternalAudioSource;

  constructor(private sourceId: string) {
    this.audioSource = this.audioService.getSource(sourceId);
  }

  getModel(): IAudioSourceModel {
    const sourceModel = this.sourcesService.getSource(this.sourceId).getModel();
    return {
      name: sourceModel.name,
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
