import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';

export class RExportInfo extends RealmObject {
  exporting: boolean;
  currentFrame: number;
  totalFrames: number;
  step: string;
  cancelRequested: boolean;
  file: string;
  previewFile: string;
  exported: boolean;
  error?: string;
  fps: number;
  resolution: number;
  preset: string;

  static schema: ObjectSchema = {
    name: 'ExportInfo',
    embedded: true,
    properties: {
      exporting: { type: 'bool', default: false },
      currentFrame: { type: 'int', default: 0 },
      totalFrames: { type: 'int', default: 0 },
      step: { type: 'string', default: 'AudioMix' },
      cancelRequested: { type: 'bool', default: false },
      file: { type: 'string', default: '' },
      previewFile: { type: 'string', default: '' },
      exported: { type: 'bool', default: false },
      error: { type: 'string', optional: true, default: null },
      fps: { type: 'int', default: 30 },
      resolution: { type: 'int', default: 720 },
      preset: { type: 'string', default: 'ultrafast' },
    },
  };

  update(exportInfo: Partial<RExportInfo>) {
    this.db.write(() => {
      Object.assign(this, {
        exported: false,
        ...exportInfo,
      });
    });
  }
}
RExportInfo.register({ persist: true });
