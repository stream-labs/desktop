import { ServiceHelper, Inject } from 'services';
import { ISerializable } from 'services/api/rpc-api';
import {
  AudioService as InternalAudioService,
  AudioSource as InternalAudioSource,
} from 'services/audio';
import { SourcesService as InternalSourcesService } from 'services/sources';
import { Fallback } from 'services/api/external-api';
import * as obs from '../../../../../obs-api';

/**
 * Fader variables.
 */
export interface IFader {
  db: number;
  deflection: number;
  mul: number;
}

/**
 * Serialized representation of an audio source.
 */
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

/**
 * API for audio source management. Provides operations related to a single
 * audio source like set deflection and mute / unmute audio source.
 */
@ServiceHelper()
export class AudioSource implements ISerializable {
  @Inject() private audioService: InternalAudioService;
  @Inject() private sourcesService: InternalSourcesService;
  @Fallback() private audioSource: InternalAudioSource;

  constructor(private sourceId: string) {
    this.audioSource = this.audioService.views.getSource(sourceId);
  }

  private isDestroyed(): boolean {
    return this.audioSource.isDestroyed();
  }

  /**
   * @return A serialized representation of this {@link AudioSource}
   */
  getModel(): IAudioSourceModel {
    const sourceModel = this.sourcesService.views.getSource(this.sourceId).getModel();
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

  /**
   * Sets the audio source's deflection.
   *
   * @param deflection the deflection number to set for this audio source
   */
  setDeflection(deflection: number): void {
    this.audioSource.setDeflection(deflection);
  }

  /**
   * Mutes /unmutes this audio source.
   *
   * @param muted Set to `true`if you want to mute the audio source, `false` to
   * unmute
   */
  setMuted(muted: boolean): void {
    this.audioSource.setMuted(muted);
  }
}
