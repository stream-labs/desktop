import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';

export class RTransitionInfo extends RealmObject {
  type: string;
  duration: number;

  static schema: ObjectSchema = {
    name: 'TransitionInfo',
    embedded: true,
    properties: {
      type: { type: 'string', default: 'fade' },
      duration: { type: 'float', default: 1 },
    },
  };
  update(transitionInfo: Partial<RTransitionInfo>) {
    this.db.write(() => {
      Object.assign(this, transitionInfo);
    });
  }
}

RTransitionInfo.register({ persist: true });
