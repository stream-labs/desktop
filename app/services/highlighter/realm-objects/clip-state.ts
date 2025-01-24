import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';
import { TStreamInfo } from '../models/highlighter.models';
import { IAiClipInfo } from '../models/ai-highlighter.models';

export class RHighlighterClip extends RealmObject {
  path: string;
  loaded: boolean;
  enabled: boolean;
  startTrim: number;
  endTrim: number;
  deleted: boolean;
  globalOrderPosition: number;
  duration?: number;
  scrubSprite?: string;
  streamInfo?: {
    [streamId: string]: TStreamInfo;
  };
  aiInfo?: IAiClipInfo;
  static schema: ObjectSchema = {
    name: 'HighlighterClip',
    embedded: true,
    properties: {
      path: { type: 'string' },
      loaded: { type: 'bool' },
      enabled: { type: 'bool' },
      startTrim: { type: 'double' },
      endTrim: { type: 'double' },
      deleted: { type: 'bool' },
      globalOrderPosition: { type: 'int' },
      scrubSprite: { type: 'string', optional: true },
      duration: { type: 'double', optional: true },
      streamInfo: { type: 'mixed', optional: true },
      aiInfo: { type: 'mixed', optional: true },
    },
  };

  update(clipInfo: Partial<RHighlighterClip>) {
    this.db.write(() => {
      Object.assign(this, clipInfo);
    });
  }
  delete() {
    this.db.write(() => {
      this.db.delete(this);
    });
  }
}

RHighlighterClip.register({ persist: true });
