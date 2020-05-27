import { AudioService as InternalAudioService } from 'services/audio';
import { Fallback, Singleton } from 'services/api/external-api';
import { AudioSource } from './audio-source';
import { Inject } from 'services';

/**
 * Provides API for manage audio sources
 */
@Singleton()
export class AudioService {
  @Fallback()
  @Inject()
  protected audioService: InternalAudioService;

  getSource(sourceId: string): AudioSource {
    const source = this.audioService.views.getSource(sourceId);
    return source ? new AudioSource(sourceId) : null;
  }

  getSources(): AudioSource[] {
    return this.audioService.views.getSources().map(source => this.getSource(source.sourceId));
  }

  getSourcesForCurrentScene(): AudioSource[] {
    return this.audioService.views.sourcesForCurrentScene.map(source =>
      this.getSource(source.sourceId),
    );
  }

  getSourcesForScene(sceneId: string): AudioSource[] {
    return this.audioService.views
      .getSourcesForScene(sceneId)
      .map(source => this.getSource(source.sourceId));
  }
}
