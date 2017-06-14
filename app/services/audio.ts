import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { mutation, StatefulService, InitAfter, Inject } from './stateful-service';
import { SourcesService, ISource, Source } from './sources';
import { ScenesService } from './scenes';
import Obs from '../api/Obs';
import Utils from './utils';

const nodeObs = Obs.nodeObs as Dictionary<Function>;

export interface IAudioSource {
  id: string;
  fader: IFader;
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
  audioSources: Dictionary<IAudioSource>;
}

interface INodeObsId {
  id: number;
}



@InitAfter(SourcesService)
export class AudioService extends StatefulService<IAudioSourcesState> {

  static initialState: IAudioSourcesState = {
    audioSources: {}
  };

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;


  protected mounted() {

    this.sourcesService.sourceAdded.subscribe(source => {
      if (!source.audio) return;
      this.ADD_AUDIO_SOURCE(this.fetchAudioSource(source.name));
    });

    this.sourcesService.sourceUpdated.subscribe(source => {
      const audioSource = this.getSource(source.id);
      if (!audioSource) return;

      if (!source.audio) {
        this.REMOVE_AUDIO_SOURCE(source.id);
        return;
      }

    });

    this.sourcesService.sourceRemoved.subscribe(source => {
      if (source.audio) this.REMOVE_AUDIO_SOURCE(source.id);
    });

  }

  getSource(sourceId: string): AudioSource {
    return this.state.audioSources[sourceId] ? new AudioSource(sourceId) : void 0;
  }

  getSources(): AudioSource[] {
    return Object.values(this.state.audioSources).map(source => this.getSource(source.id));
  }

  getSourcesForCurrentScene(): AudioSource[] {
    const sceneSources = this.scenesService.getSources({ showHidden: true }).filter((source: any) => source.audio);
    return sceneSources.map((sceneSource: ISource) => this.getSource(sceneSource.id));
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


  setDeflection(sourceId: string, deflection: number) {
    const source = this.getSource(sourceId);
    const fader = nodeObs.OBS_content_getSourceFader(source.name);
    nodeObs.OBS_audio_faderSetDeflection(fader, deflection);
    this.UPDATE_AUDIO_SOURCE(source.id, this.fetchAudioSource(source.name));
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
      fader
    };
  }


  @mutation
  private ADD_AUDIO_SOURCE(source: IAudioSource) {
    this.state.audioSources[source.id] = source;
  }


  @mutation
  private UPDATE_AUDIO_SOURCE(sourceId: string, patch: Partial<IAudioSource>) {
    Object.assign(this.state.audioSources[sourceId], patch);
  }


  @mutation
  private REMOVE_AUDIO_SOURCE(sourceId: string) {
    delete this.state.audioSources[sourceId];
  }
}

export class AudioSource extends Source implements IAudioSource {
  fader: IFader;

  @Inject()
  audioService: AudioService;

  constructor(sourceId: string) {
    super(sourceId);
    Utils.applyProxy(this, this.audioService.state.audioSources[sourceId]);
  }

}
