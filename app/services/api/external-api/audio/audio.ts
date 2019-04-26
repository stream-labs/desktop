import { AudioService as InternalAudioService } from 'services/audio';
import { Inject } from 'util/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { AudioSource } from './audio-source';
import * as obs from '../../../../../obs-api';

/**
 * Provides API for manage audio sources
 */
@Singleton()
export class AudioService {
  @Fallback()
  @Inject()
  protected audioService: InternalAudioService;

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
