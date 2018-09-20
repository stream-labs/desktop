import { Module, EApiPermissions, apiMethod, apiEvent, NotImplementedError, IApiContext } from './module';
import { SourcesService, TSourceType, Source } from 'services/sources';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs/Subject';

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
}

export class SourcesModule extends Module {

  moduleName = 'Sources';
  permissions = [EApiPermissions.ScenesSources];

  @Inject() private sourcesService: SourcesService;

  constructor() {
    super();
    this.sourcesService.sourceAdded.subscribe(sourceData => {
      const source = this.sourcesService.getSourceById(sourceData.sourceId);
      this.sourceAdded.next(this.serializeSource(source));
    });
    this.sourcesService.sourceUpdated.subscribe(sourceData => {
      const source = this.sourcesService.getSourceById(sourceData.sourceId);
      this.sourceUpdated.next(this.serializeSource(source));
    })
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
  getSources() {
    return this.sourcesService.getSources().map(source => this.serializeSource(source));
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
  createSource() {
    throw new NotImplementedError();
  }

  @apiMethod()
  updateSource(ctx: IApiContext, patch: Partial<ISource>) {
    const requiredKeys = ['id'];
    this.validatePatch(requiredKeys, patch);

    const source = this.sourcesService.getSource(patch.id);

    if (patch.name) source.setName(patch.name);
  }

  @apiMethod()
  removeSource() {
    throw new NotImplementedError();
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
      serialized.appId = source.getPropertiesManagerSettings().appId;
    }

    return serialized;
  }

}

