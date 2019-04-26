import { ServiceHelper } from '../../../stateful-service';
import { ISerializable } from '../../rpc-api';
import { Inject } from '../../../../util/injector';
import {
  AudioService as InternalAudioService,
  AudioSource as InternalAudioSource,
} from 'services/audio';
import { Fallback } from '../../external-api';
import { IAudioSourceModel } from './audio';

@ServiceHelper()
export class AudioSource implements ISerializable {
  @Inject() private audioService: InternalAudioService;
  @Fallback() private audioSource: InternalAudioSource;

  constructor(private sourceId: string) {
    this.audioSource = this.audioService.getSource(sourceId);
  }

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
