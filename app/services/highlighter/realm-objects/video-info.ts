import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';
import { ISingleVideoInfo, IVideoInfo } from '../models/rendering.models';

export class RSingleVideoInfo extends RealmObject {
  path: string;
  duration?: number;
  static schema: ObjectSchema = {
    name: 'SingleVideoInfo',
    embedded: true,
    properties: {
      path: { type: 'string', default: '' },
      duration: { type: 'int', default: null },
    },
  };

  update(singleVideoInfo: ISingleVideoInfo) {
    this.db.write(() => {
      this.path = singleVideoInfo.path;
      this.duration = singleVideoInfo.duration;
    });
  }
}
RSingleVideoInfo.register({ persist: true });

export class RVideoInfo extends RealmObject {
  intro: RSingleVideoInfo;
  outro: RSingleVideoInfo;

  static schema: ObjectSchema = {
    name: 'VideoInfo',
    embedded: true,
    properties: {
      intro: { type: 'object', objectType: 'SingleVideoInfo', default: {} },
      outro: { type: 'object', objectType: 'SingleVideoInfo', default: {} },
    },
  };
  update(videoInfo: Partial<IVideoInfo>) {
    this.db.write(() => {
      this.intro.update(videoInfo.intro);
      this.outro.update(videoInfo.outro);
    });
  }
}

RVideoInfo.register({ persist: true });
