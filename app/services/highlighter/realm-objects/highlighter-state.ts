import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';
import { IAudioInfo, IExportInfo, ITransitionInfo, IVideoInfo } from '../models/rendering.models';
import { TClip, IUploadInfo, IHighlightedStream } from '../models/highlighter.models';
import { RTransitionInfo } from './transition-info';
import { RVideoInfo } from './video-info';
import { RAudioInfo } from './audio-info';
import { RUploadInfo } from './upload-info';
import { RExportInfo } from './export-info-state';

export { RTransitionInfo } from './transition-info';
export { RVideoInfo } from './video-info';
export { RAudioInfo } from './audio-info';
export { RUploadInfo } from './upload-info';
export { RExportInfo } from './export-info-state';

export class RHighlighterState extends RealmObject {
  // Settings
  dismissedTutorial: boolean;
  error: string;
  useAiHighlighter: boolean;
  updaterProgress: number;
  isUpdaterRunning: boolean;
  highlighterVersion: string;

  clips: Dictionary<TClip>;
  highlightedStreams: IHighlightedStream[];

  transition: RTransitionInfo;
  video: RVideoInfo;
  audio: RAudioInfo;
  export: RExportInfo;

  upload: RUploadInfo;

  static schema: ObjectSchema = {
    name: 'HighlighterState',
    properties: {
      clips: { type: 'dictionary', objectType: 'mixed', default: {} },
      highlightedStreams: { type: 'list', objectType: 'mixed', default: [] },
      dismissedTutorial: { type: 'bool', default: false },
      error: { type: 'string', default: '' },
      useAiHighlighter: { type: 'bool', default: false },
      updaterProgress: { type: 'int', default: 0 },
      isUpdaterRunning: { type: 'bool', default: false },
      highlighterVersion: { type: 'string', default: '' },
      transition: {
        type: 'object',
        objectType: 'TransitionInfo',
        default: {},
      },
      video: {
        type: 'object',
        objectType: 'VideoInfo',
        default: {},
      },
      audio: {
        type: 'object',
        objectType: 'AudioInfo',
        default: {},
      },
      export: {
        type: 'object',
        objectType: 'ExportInfo',
        default: {},
      },
      upload: {
        type: 'object',
        objectType: 'UploadInfo',
        default: {},
      },
    },
  };

  protected onCreated(): void {
    // load persisted horizontal settings from service
    const data = localStorage.getItem('PersistentStatefulService-HighlighterService');

    if (data) {
      const parsed = JSON.parse(data);
    }
  }

  get currentHighlighterVersion() {
    return this.highlighterVersion;
  }

  get clipsArray(): TClip[] {
    return Object.values(this.clips);
  }
  // Clips mutations
  addClip(clip: TClip) {
    this.db.write(() => {
      this.clips[clip.path] = clip;
      this.export.exported = false;
    });
  }
  updateClip(clip: Partial<TClip>) {
    this.db.write(() => {
      this.clips[clip.path] = { ...this.clips[clip.path], ...clip } as TClip;
      this.export.exported = false;
    });
  }

  removeClip(clipPath: string) {
    this.db.write(() => {
      delete this.clips[clipPath];
      this.export.exported = false;
    });
  }
  // Settings mutations
  dismissTutorial() {
    this.db.write(() => {
      this.dismissedTutorial = true;
    });
  }

  setError(error: string) {
    this.db.write(() => {
      this.error = error;
    });
  }

  setUseAiHighlighter(useAiHighlighter: boolean) {
    this.db.write(() => {
      this.useAiHighlighter = useAiHighlighter;
    });
  }

  addHighlightedStream(streamInfo: IHighlightedStream) {
    this.db.write(() => {
      this.highlightedStreams.push(streamInfo);
    });
  }

  updateHighlightedStream(updatedStreamInfo: IHighlightedStream) {
    this.db.write(() => {
      const keepAsIs = this.highlightedStreams.filter(stream => stream.id !== updatedStreamInfo.id);
      this.highlightedStreams = [...keepAsIs, updatedStreamInfo];
    });
  }

  removeHighlightedStream(id: string) {
    this.db.write(() => {
      this.highlightedStreams = this.highlightedStreams.filter(stream => stream.id !== id);
    });
  }

  setUpdaterProgress(progress: number) {
    this.db.write(() => {
      this.updaterProgress = progress;
    });
  }

  setUpdaterState(isRunning: boolean) {
    this.db.write(() => {
      this.isUpdaterRunning = isRunning;
    });
  }

  setHighlighterVersion(version: string) {
    this.db.write(() => {
      this.highlighterVersion = version;
    });
  }
}
RHighlighterState.register({ persist: true });
