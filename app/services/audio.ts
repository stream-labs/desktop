import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { mutation, StatefulService, InitAfter, Inject } from './stateful-service';
import { SourcesService, ISource } from './sources';
import ScenesService from './scenes';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs as Dictionary<Function>;

export interface IAudioSource {
  id: string;
  name: string;
  fader: IFader;
  muted: boolean;
}

export interface IVolmeter {
  level: number;
  magnitude: number;
  peak: number;
  muted: number;
}

interface IFader {
  db: number;
  deflection: number;
}

interface IAudioSourcesState {
  audioSources: IAudioSource[];
}

interface INodeObsId {
  id: number;
}


@InitAfter(SourcesService)
export class AudioService extends StatefulService<IAudioSourcesState> {

  static initialState: IAudioSourcesState = {
    audioSources: []
  };

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;


  protected mounted() {

    this.sourcesService.sourceAdded.subscribe(source => {
      if (!source.audio) return;
      this.ADD_AUDIO_SOURCE(this.fetchAudioSource(source.name));
    });

    this.sourcesService.sourceUpdated.subscribe(source => {
      const audioSource = this.state.audioSources.find(audioSource => audioSource.id === source.id);
      if (!audioSource) return;

      if (!source.audio) {
        this.REMOVE_AUDIO_SOURCE(source.name);
        return;
      }

      if (audioSource.muted !== source.muted) {
        this.UPDATE_AUDIO_SOURCE(source.name, { muted: source.muted });
      }
    });

    this.sourcesService.sourceRemoved.subscribe(source => {
      if (source.audio) this.REMOVE_AUDIO_SOURCE(source.name);
    });

  }


  getSourcesForCurrentScene(): IAudioSource[] {
    const sceneSources = this.scenesService.sources;
    return this.state.audioSources.filter(audioSource => {
      return sceneSources.find((source: ISource) => source.name === audioSource.name);
    });
  }


  subscribeVolmeter(sourceName: string, cb: (volmeter: IVolmeter) => void): Subscription {
    const volmeterStream = new Subject<IVolmeter>();
    const volmeterId = nodeObs.OBS_content_getSourceVolmeter(sourceName) as INodeObsId;

    // uncomment to slow down the volmeter updating
    // nodeObs.OBS_audio_volmeterSetUpdateInterval(volmeterId, 1000);

    const obsSubscription = nodeObs.OBS_audio_volmeterAddCallback(volmeterId, (volmeter: IVolmeter) => {
      volmeterStream.next(volmeter);
    }) as INodeObsId;

    return volmeterStream.subscribe(cb).add(() => {
      nodeObs.OBS_audio_volmeterRemoveCallback(volmeterId, obsSubscription);
    });
  }


  setDeflection(sourceName: string, deflection: number) {
    const fader = nodeObs.OBS_content_getSourceFader(sourceName);
    nodeObs.OBS_audio_faderSetDeflection(fader, deflection);
    this.UPDATE_AUDIO_SOURCE(sourceName, this.fetchAudioSource(sourceName));
  }


  setMuted(id: string, muted: boolean) {
    this.sourcesService.setMuted(id, muted);
  }


  private fetchAudioSource(sourceName: string): IAudioSource {
    const source = this.sourcesService.getSourceByName(sourceName);
    const fader = nodeObs.OBS_content_getSourceFader(sourceName);
    fader.db = fader.db || 0;
    return {
      id: source.id,
      name: source.name,
      muted: source.muted,
      fader
    };
  }


  @mutation
  private ADD_AUDIO_SOURCE(source: IAudioSource) {
    this.state.audioSources.push(source);
  }


  @mutation
  private UPDATE_AUDIO_SOURCE(sourceName: string, patch: Partial<IAudioSource>) {
    const source = this.state.audioSources.find(source => sourceName === source.name);
    Object.assign(source, patch);
  }


  @mutation
  private REMOVE_AUDIO_SOURCE(sourceName: string) {
    this.state.audioSources = this.state.audioSources.filter(source => source.name !== sourceName);
  }
}
