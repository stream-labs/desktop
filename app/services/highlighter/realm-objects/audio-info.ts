import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';

export class RAudioInfo extends RealmObject {
  musicEnabled: boolean;
  musicPath: string;
  musicVolume: number;

  static schema: ObjectSchema = {
    name: 'AudioInfo',
    embedded: true,
    properties: {
      musicEnabled: { type: 'bool', default: false },
      musicPath: { type: 'string', default: '' },
      musicVolume: { type: 'float', default: 50 },
    },
  };

  update(audioInfo: Partial<RAudioInfo>) {
    this.db.write(() => {
      Object.assign(this, audioInfo);
    });
  }
}

RAudioInfo.register({ persist: true });
