import { AudioService as InternalAudioService } from 'services/audio';
import { Fallback, Singleton } from 'services/api/external-api';
import { AudioSource } from './audio-source';
import { Inject } from 'services';

/**
 * API for audio sources management. This API provides methods for retrieving
 * references to audio sources. If you need to execute further actions see
 * {@link AudioSource}, {@link SceneItem} and {@link SourcesService}.
 */
@Singleton()
export class AudioService {
  @Fallback()
  @Inject()
  protected audioService: InternalAudioService;

  /**
   * Returns the audio source with the provided id or null if no audio
   * source was found with that.
   *
   * @param sourceId The id of the audio source
   * @returns The audio source with the provided id or `null if there is no
   * audio source with this id
   */
  getSource(sourceId: string): AudioSource {
    const source = this.audioService.views.getSource(sourceId);
    return source ? new AudioSource(sourceId) : null;
  }

  /**
   * @returns A list of all audio sources
   */
  getSources(): AudioSource[] {
    return this.audioService.views.getSources().map(source => this.getSource(source.sourceId));
  }

  /**
   * @returns A list of all audio sources of the currently active scene.
   */
  getSourcesForCurrentScene(): AudioSource[] {
    return this.audioService.views.sourcesForCurrentScene.map(source =>
      this.getSource(source.sourceId),
    );
  }

  /**
   * Returns a list of audio sources for a specific scene.
   *
   * @param sceneId The id of the scene to get the audio sources from
   * @returns The list of audio sources of the specific id.
   */
  getSourcesForScene(sceneId: string): AudioSource[] {
    return this.audioService.views
      .getSourcesForScene(sceneId)
      .map(source => this.getSource(source.sourceId));
  }
}
