import { Module, EApiPermissions, apiMethod, apiEvent, NotImplementedError, IApiContext } from './module';
import { SourcesService, TSourceType, Source } from 'services/sources';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs';
import { PlatformAppsService } from 'services/platform-apps';
import { ScenesService } from 'services/scenes';
import { AudioService } from 'services/audio';

interface ISourceFlags {
  audio: boolean;
  video: boolean;
  async: boolean;
}

interface ISourceSize {
  width: number;
  height: number;
}

interface ISource {
  id: string;
  name: string;
  type: TSourceType;
  flags: ISourceFlags;
  size: ISourceSize;
  appId?: string;
  appSourceId?: string;
  muted?: boolean;
  volume?: number;
}

export class SourcesModule extends Module {

  moduleName = 'Sources';
  permissions = [EApiPermissions.ScenesSources];

  @Inject() private sourcesService: SourcesService;
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private scenesService: ScenesService;
  @Inject() private audioService: AudioService;

  constructor() {
    super();
    this.sourcesService.sourceAdded.subscribe(sourceData => {
      const source = this.sourcesService.getSourceById(sourceData.sourceId);
      this.sourceAdded.next(this.serializeSource(source));
    });
    this.sourcesService.sourceUpdated.subscribe(sourceData => {
      const source = this.sourcesService.getSourceById(sourceData.sourceId);
      this.sourceUpdated.next(this.serializeSource(source));
    });
    this.sourcesService.sourceRemoved.subscribe(sourceData => {
      this.sourceRemoved.next(sourceData.sourceId);
    });
  }

  @apiEvent()
  sourceAdded = new Subject<ISource>();

  @apiEvent()
  sourceUpdated = new Subject<ISource>();

  @apiEvent()
  sourceRemoved = new Subject<string>();

  @apiMethod()
  getAvailableSourceTypes(): string[] {
    return this.sourcesService.getAvailableSourcesTypes();
  }

  @apiMethod()
  getSources() {
    return this.sourcesService.getSources().map(source => this.serializeSource(source));
  }

  @apiMethod()
  getSource(_ctx: IApiContext, id: string): ISource | null {
    const source = this.sourcesService.getSource(id);

    return source ? this.serializeSource(source) : null;
  }

  @apiMethod()
  getAppSources(ctx: IApiContext) {
    return this.getSources().filter(source => {
      return source.appId === ctx.app.id;
    });
  }

  @apiMethod()
  getAppSourceSettings(ctx: IApiContext, sourceId: string) {
    const source = this.getAppSourceForApp(sourceId, ctx.app.id);

    return source.getPropertiesManagerSettings().appSettings;
  }

  @apiMethod()
  setAppSourceSettings(ctx: IApiContext, sourceId: string, settings: string) {
    const source = this.getAppSourceForApp(sourceId, ctx.app.id);

    source.setPropertiesManagerSettings({
      appSettings: settings
    });
  }

  private getAppSourceForApp(sourceId: string, appId: string) {
    const source = this.sourcesService.getSource(sourceId);

    if (!source) {
      throw new Error(`The source with id ${sourceId} does not exist!`);
    }

    if (source.getPropertiesManagerSettings().appId !== appId) {
      throw new Error(`The source ${sourceId} does not belong to this app!`);
    }

    return source;
  }

  @apiMethod()
  createSource(ctx: IApiContext, name: string, type: TSourceType, settings: Dictionary<any> = {}) {
    const source = this.sourcesService.createSource(
      name,
      type,
      settings
    );

    return this.serializeSource(source);
  }

  /**
   * Creates an app source that belongs to this app
   */
  @apiMethod()
  createAppSource(ctx: IApiContext, name: string, appSourceId: string) {
    const size = this.platformAppsService.getAppSourceSize(
      ctx.app.id,
      appSourceId
    );

    // TODO: We support other app source types in the future
    const source = this.sourcesService.createSource(
      name,
      'browser_source',
      size,
      {
        propertiesManager: 'platformApp',
        propertiesManagerSettings: {
          appId: ctx.app.id,
          appSourceId,
          appSettings: {}
        }
      }
    );

    return this.serializeSource(source);
  }

  @apiMethod()
  updateSource(ctx: IApiContext, patch: Partial<ISource>) {
    const requiredKeys = ['id'];
    this.validatePatch(requiredKeys, patch);

    const source = this.sourcesService.getSource(patch.id);

    if (patch.name) {
      source.setName(patch.name);
    }

    if (patch.muted != null) {
      this.audioService.getSource(patch.id).setMuted(patch.muted);
    }

    if (patch.volume != null) {
      this.audioService.getSource(patch.id).setDeflection(patch.volume);
    }
  }

  @apiMethod()
  removeSource(ctx: IApiContext, sourceId: string) {
    // Make sure this source doesn't exist in any scenes
    const item = this.scenesService.getSceneItems().find(sceneItem => {
      return sceneItem.sourceId === sourceId;
    });

    if (item) {
      throw new Error(`Source ${sourceId} exists in at least 1 scene and cannot be removed!`);
    }

    this.sourcesService.removeSource(sourceId);
  }

  @apiMethod()
  getObsSettings(ctx: IApiContext, sourceId: string) {
    return this.sourcesService.getSource(sourceId).getSettings();
  }

  @apiMethod()
  setObsSettings(ctx: IApiContext, sourceId: string, settingsPatch: Dictionary<any>) {
    return this.sourcesService.getSource(sourceId).updateSettings(settingsPatch);
  }

  private serializeSource(source: Source): ISource {
    const serialized: ISource = {
      id: source.sourceId,
      name: source.name,
      type: source.type,
      flags: {
        audio: source.audio,
        video: source.video,
        async: source.async
      },
      size: {
        width: source.width,
        height: source.height
      }
    };

    if (source.getPropertiesManagerType() === 'platformApp') {
      const settings = source.getPropertiesManagerSettings();
      serialized.appId = settings.appId;
      serialized.appSourceId = settings.appSourceId;
    }

    if (source.audio) {
      const audioSource = this.audioService.getSource(source.sourceId);
      serialized.volume = audioSource.fader.deflection;
      serialized.muted = audioSource.muted;
    }

    return serialized;
  }

}

