import {
  Source as InternalSource,
  SourcesService as InternalSourcesService,
  TSourceType,
} from 'services/sources';
import { ServiceHelper, Inject } from 'services';
import { ISerializable } from '../../rpc-api';
import { TObsFormData } from 'components/obs/inputs/ObsInput';

export interface ISourceModel {
  sourceId: string;
  id: string; // Streamdeck uses id field
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  async: boolean;
  muted: boolean;
  width: number;
  height: number;
  doNotDuplicate: boolean;
  channel?: number;
}

@ServiceHelper()
export class Source implements ISourceModel, ISerializable {
  @Inject() private sourcesService: InternalSourcesService;
  readonly id: string;
  readonly name: string;
  readonly type: TSourceType;
  readonly audio: boolean;
  readonly video: boolean;
  readonly async: boolean;
  readonly muted: boolean;
  readonly width: number;
  readonly height: number;
  readonly doNotDuplicate: boolean;
  readonly channel?: number;
  readonly resourceId: string;

  private source: InternalSource;

  constructor(public readonly sourceId: string) {
    this.source = this.sourcesService.getSource(sourceId);
  }

  getModel(): ISourceModel {
    return {
      sourceId: this.sourceId,
      id: this.sourceId,
      name: this.source.name,
      type: this.source.type,
      audio: this.source.audio,
      video: this.source.video,
      async: this.source.async,
      muted: this.source.muted,
      width: this.source.width,
      height: this.source.height,
      doNotDuplicate: this.source.doNotDuplicate,
      channel: this.source.channel,
    };
  }

  updateSettings(settings: Dictionary<any>): void {
    this.source.updateSettings(settings);
  }

  getSettings(): Dictionary<any> {
    return this.source.getSettings();
  }

  getPropertiesFormData(): TObsFormData {
    return this.source.getPropertiesFormData();
  }

  setPropertiesFormData(properties: TObsFormData): void {
    return this.source.setPropertiesFormData(properties);
  }

  hasProps(): boolean {
    return this.source.hasProps();
  }

  setName(newName: string): void {
    return this.source.setName(newName);
  }

  refresh(): void {
    this.source.refresh();
  }
}
