import * as remote from '@electron/remote';
import os from 'os';
import moment from 'moment';
import uuid from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import * as Sentry from '@sentry/browser';

import { Inject } from 'vue-property-decorator';
import { throttle } from 'lodash-decorators';

import { InitAfter, Service } from '../core';
import { UserService } from '../user';
import { EStreamingState, StreamingService } from '../streaming';
import { RHighlighterState } from './realm-objects/highlighter-state';
import { JsonrpcService } from '../api/jsonrpc';
import { DismissablesService, EDismissable } from '../dismissables';
import { IncrementalRolloutService, EAvailableFeatures } from '../incremental-rollout';
import { SharedStorageService } from '../integrations/shared-storage';
import { NavigationService } from '../navigation';
import { ENotificationType, NotificationsService } from '../notifications';
import { TAnalyticsEvent, UsageStatisticsService } from '../usage-statistics';
import { AiHighlighterUpdater } from './ai-highlighter-updater';
import {
  IAiClip,
  IHighlightedStream,
  INewClipData,
  isAiClip,
  IStreamInfoForAiHighlighter,
  IStreamMilestones,
  TClip,
  TStreamInfo,
} from './models/highlighter.models';
import { RenderingClip } from './rendering/rendering-clip';
import {
  ensureScrubDirectory,
  extractDateTimeFromPath,
  fileExists,
  removeScrubFile,
} from './file-utils';
import { EMenuItemKey } from '../side-nav';
import { pmap } from '../../util/pmap';
import { SUPPORTED_FILE_TYPES } from './constants';
import { $t } from '../i18n';
import { addVerticalFilterToExportOptions } from './vertical-export';
import {
  EAiDetectionState,
  IHighlight,
  IHighlighterMilestone,
  IInput,
  TOrientation,
} from './models/ai-highlighter.models';
import {
  EExportStep,
  IExportOptions,
  IExportInfo,
  TFPS,
  TPreset,
  ITransitionInfo,
} from './models/rendering.models';
import { startRendering } from './rendering/start-rendering';
import { IDownloadProgress } from '../../util/requests';
import { ProgressTracker, getHighlightClips, getRoundDetails } from './ai-highlighter-utils';
import { cutHighlightClips } from './cut-highlight-clips';
import { IYoutubeUploadResponse, IYoutubeVideoUploadOptions } from '../platforms/youtube/uploader';
import { getPlatformService } from '../platforms';
import { YoutubeService } from '../platforms/youtube';

export class RHighlighterService extends Service {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() dismissablesService: DismissablesService;
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;
  @Inject() navigationService: NavigationService;
  @Inject() sharedStorageService: SharedStorageService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  state = RHighlighterState.inject();

  aiHighlighterUpdater: AiHighlighterUpdater;
  aiHighlighterFeatureEnabled = false;
  streamMilestones?: IStreamMilestones = null;

  /**
   * A dictionary of actual clip classes.
   * These are not serializable so kept out of state.
   */
  renderingClips: Dictionary<RenderingClip> = {};
  directoryCleared = false;

  //* =============================================
  // Initializers
  //* =============================================

  async init() {
    try {
      console.log('RealmHighlighterService: init');
      console.log(this.incrementalRolloutService);

      this.initRolloutService();
      this.initClips();
      this.initExportInfo();
      this.initFallbackVideoDirectory();
      this.handleStreamingChanges();
    } catch (error: unknown) {
      console.error('Failed to init HighlighterService:', error);
      throw error;
    }
  }

  close() {
    // TODO-jk: Do we need to close
  }

  initRolloutService() {
    this.incrementalRolloutService.featuresReady.then(async () => {
      this.aiHighlighterFeatureEnabled = this.incrementalRolloutService.views.featureIsEnabled(
        EAvailableFeatures.aiHighlighter,
      );

      if (this.aiHighlighterFeatureEnabled && !this.aiHighlighterUpdater) {
        this.aiHighlighterUpdater = new AiHighlighterUpdater();
      }
    });
  }

  initClips() {
    this.state.clipsArray.forEach(clip => {
      // Check if .moments exist, if so, rename to inputs
      if (isAiClip(clip) && (clip.aiInfo as any).moments) {
        clip.aiInfo.inputs = (clip.aiInfo as any).moments;
        delete (clip.aiInfo as any).moments;
      }
      //Check if files are existent, if not, delete
      if (!fileExists(clip.path)) {
        this.removeClip(clip.path, undefined);
      }
      //   Set all clips to unloaded
      this.state.updateClip({
        path: clip.path,
        loaded: false,
      });
    });
  }

  initExportInfo() {
    if (this.state.export.exporting) {
      this.state.export.update({
        exporting: false,
        error: null,
        cancelRequested: false,
      });
    }
  }

  initFallbackVideoDirectory() {
    try {
      // On some very very small number of systems, we won't be able to fetch
      // the videos path from the system.
      // TODO: Add a fallback directory?
      this.state.export.update({
        file: path.join(remote.app.getPath('videos'), 'Output.mp4'),
      });
    } catch (e: unknown) {
      console.error('Got error fetching videos directory', e);
    }
  }

  private handleStreamingChanges() {
    let aiRecordingStartTime = moment();
    let streamInfo: IStreamInfoForAiHighlighter;
    let streamStarted = false;
    let aiRecordingInProgress = false;

    this.streamingService.replayBufferFileWrite.subscribe(async clipPath => {
      const streamId = streamInfo?.id || undefined;
      let endTime: number | undefined;

      if (streamId) {
        endTime = moment().diff(aiRecordingStartTime, 'seconds');
      } else {
        endTime = undefined;
      }

      const REPLAY_BUFFER_DURATION = 20; // TODO M: Replace with settingsservice
      const startTime = Math.max(0, endTime ? endTime - REPLAY_BUFFER_DURATION : 0);

      this.addClips([{ path: clipPath, startTime, endTime }], streamId, 'ReplayBuffer');
    });

    this.streamingService.streamingStatusChange.subscribe(async status => {
      if (status === EStreamingState.Live) {
        streamStarted = true; // console.log('live', this.streamingService.views.settings.platforms.twitch.title);

        if (!this.aiHighlighterFeatureEnabled) {
          return;
        }

        if (this.state.useAiHighlighter === false) {
          console.log('HighlighterService: Game:', this.streamingService.views.game);
          // console.log('Highlighter not enabled or not Fortnite');
          return;
        }

        // console.log('recording Alreadyt running?:', this.streamingService.views.isRecording);
        this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
          type: 'AiRecordingStarted',
        });

        if (this.streamingService.views.isRecording) {
          // console.log('Recording is already running');
        } else {
          this.streamingService.actions.toggleRecording();
        }
        streamInfo = {
          id: 'fromStreamRecording' + uuid(),
          title: this.streamingService.views.settings.platforms.twitch?.title,
          game: this.streamingService.views.game,
        };
        aiRecordingInProgress = true;
        aiRecordingStartTime = moment();
      }

      if (status === EStreamingState.Offline) {
        if (
          streamStarted &&
          this.state.clipsArray.length > 0 &&
          this.dismissablesService.views.shouldShow(EDismissable.HighlighterNotification)
        ) {
          this.notificationsService.push({
            type: ENotificationType.SUCCESS,
            lifeTime: -1,
            message: $t(
              'Edit your replays with Highlighter, a free editor built in to Streamlabs.',
            ),
            action: this.jsonrpcService.createRequest(
              Service.getResourceId(this),
              'notificationAction',
            ),
          });

          this.usageStatisticsService.recordAnalyticsEvent(
            this.state.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
            {
              type: 'NotificationShow',
            },
          );
        }

        streamStarted = false;
      }
      if (status === EStreamingState.Ending) {
        if (!aiRecordingInProgress) {
          return;
        }
        this.streamingService.actions.toggleRecording();

        // Load potential replaybuffer clips
        await this.loadClips(streamInfo.id);
      }
    });

    this.streamingService.latestRecordingPath.subscribe(path => {
      if (!aiRecordingInProgress) {
        return;
      }

      aiRecordingInProgress = false;
      this.detectAndClipAiHighlights(path, streamInfo);

      this.navigationService.actions.navigate(
        'Highlighter',
        { view: 'stream' },
        EMenuItemKey.Highlighter,
      );
    });
  }

  notificationAction() {
    this.navigationService.navigate('Highlighter');
    this.dismissablesService.dismiss(EDismissable.HighlighterNotification);
    this.usageStatisticsService.recordAnalyticsEvent(
      this.state.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
      {
        type: 'NotificationClick',
      },
    );
  }

  //* =============================================
  // SETTINGS
  //* =============================================
  dismissError() {
    if (this.state.export.error) this.state.export.update({ error: null });
    if (this.state.upload.error) this.state.upload.update({ error: false });
    if (this.state.error) this.state.setError('');
  }

  //* =============================================
  // CLIPS
  //* =============================================

  async loadClips(streamInfoId?: string | undefined) {
    const clipsToLoad: TClip[] = this.getClips(this.state.clipsArray, streamInfoId);
    // this.resetRenderingClips();
    await ensureScrubDirectory();

    for (const clip of clipsToLoad) {
      if (!fileExists(clip.path)) {
        this.removeClip(clip.path, streamInfoId);
        return;
      }

      if (!SUPPORTED_FILE_TYPES.map(e => `.${e}`).includes(path.parse(clip.path).ext)) {
        this.removeClip(clip.path, streamInfoId);
        this.state.setError(
          $t(
            'One or more clips could not be imported because they were not recorded in a supported file format.',
          ),
        );
      }

      this.renderingClips[clip.path] =
        this.renderingClips[clip.path] ?? new RenderingClip(clip.path);
    }

    //TODO M: tracking type not correct
    await pmap(
      clipsToLoad.filter(c => !c.loaded),
      c => this.renderingClips[c.path].init(),
      {
        concurrency: os.cpus().length,
        onProgress: completed => {
          this.usageStatisticsService.recordAnalyticsEvent(
            this.state.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
            {
              type: 'ClipImport',
              source: completed.source,
            },
          );
          this.state.updateClip({
            path: completed.path,
            loaded: true,
            scrubSprite: this.renderingClips[completed.path].frameSource?.scrubJpg,
            duration: this.renderingClips[completed.path].duration,
            deleted: this.renderingClips[completed.path].deleted,
          });
        },
      },
    );
    return;
  }

  addClips(
    newClips: { path: string; startTime?: number; endTime?: number }[],
    streamId: string | undefined,
    source: 'Manual' | 'ReplayBuffer',
  ) {
    newClips.forEach((clipData, index) => {
      const currentClips = this.getClips(this.state.clipsArray, streamId);
      const allClips = this.getClips(this.state.clipsArray, undefined);
      const getHighestGlobalOrderPosition = allClips.length;

      let newStreamInfo: { [key: string]: TStreamInfo } = {};
      if (source === 'Manual') {
        if (streamId) {
          currentClips.forEach(clip => {
            if (clip?.streamInfo?.[streamId] === undefined) {
              return;
            }

            const updatedStreamInfo = {
              ...clip.streamInfo,
              [streamId]: {
                ...clip.streamInfo[streamId],
                orderPosition: clip.streamInfo[streamId]!.orderPosition + 1,
              },
            };
            // update streaminfo position
            this.state.updateClip({
              path: clip.path,
              streamInfo: updatedStreamInfo,
            });
          });

          // Update globalOrderPosition of all other items as well
          allClips.forEach(clip => {
            this.state.updateClip({
              path: clip.path,
              globalOrderPosition: clip.globalOrderPosition + 1,
            });
          });

          newStreamInfo = {
            [streamId]: {
              orderPosition: 0 + index,
            },
          };
        } else {
          // If no streamId currentCLips = allClips
          currentClips.forEach(clip => {
            this.state.updateClip({
              path: clip.path,
              globalOrderPosition: clip.globalOrderPosition + 1,
            });
          });
        }
      } else {
        if (streamId) {
          newStreamInfo = {
            [streamId]: {
              orderPosition: index + currentClips.length + 1,
              initialStartTime: clipData.startTime,
              initialEndTime: clipData.endTime,
            },
          };
        }
      }

      if (this.state.clips[clipData.path]) {
        //Add new newStreamInfo, wont be added if no streamId is available
        const updatedStreamInfo = {
          ...this.state.clips[clipData.path].streamInfo,
          ...newStreamInfo,
        };

        this.state.updateClip({
          path: clipData.path,
          streamInfo: updatedStreamInfo,
        });
        return;
      } else {
        const newClip: TClip = {
          path: clipData.path,
          loaded: false,
          enabled: true,
          startTrim: 0,
          endTrim: 0,
          deleted: false,
          source,

          // Manual clips always get prepended to be visible after adding them
          // ReplayBuffers will appended to have them in the correct order.
          globalOrderPosition:
            source === 'Manual' ? 0 + index : index + getHighestGlobalOrderPosition + 1,
          streamInfo: streamId !== undefined ? newStreamInfo : undefined,
        };
        this.state.addClip(newClip);
      }
    });
    return;
  }

  async addAiClips(newClips: INewClipData[], newStreamInfo: IStreamInfoForAiHighlighter) {
    const currentHighestOrderPosition = this.getClips(this.state.clipsArray, newStreamInfo.id)
      .length;
    const getHighestGlobalOrderPosition = this.getClips(this.state.clipsArray, undefined).length;

    newClips.forEach((clip, index) => {
      // Don't allow adding the same clip twice for ai clips
      if (this.state.clips[clip.path]) return;

      const streamInfo: { [key: string]: TStreamInfo } = {
        [newStreamInfo.id]: {
          // Orderposition will get overwritten by sortStreamClipsByStartTime after creation
          orderPosition:
            index + currentHighestOrderPosition + (currentHighestOrderPosition === 0 ? 0 : 1),
          initialStartTime: clip.startTime,
          initialEndTime: clip.endTime,
        },
      };
      const newAiClip: IAiClip = {
        path: clip.path,
        loaded: false,
        enabled: true,
        startTrim: clip.startTrim,
        endTrim: clip.endTrim,
        deleted: false,
        source: 'AiClip',
        aiInfo: clip.aiClipInfo,
        globalOrderPosition:
          index + getHighestGlobalOrderPosition + (getHighestGlobalOrderPosition === 0 ? 0 : 1),
        streamInfo,
      };

      this.state.addClip(newAiClip);
    });
    this.sortStreamClipsByStartTime(this.state.clipsArray, newStreamInfo);
    await this.loadClips(newStreamInfo.id);
  }

  enableClip(path: string, enabled: boolean) {
    this.state.updateClip({
      path,
      enabled,
    });
  }
  disableClip(path: string) {
    this.state.updateClip({
      path,
      enabled: false,
    });
  }

  setStartTrim(path: string, trim: number) {
    this.state.updateClip({
      path,
      startTrim: trim,
    });
  }

  setEndTrim(path: string, trim: number) {
    this.state.updateClip({
      path,
      endTrim: trim,
    });
  }

  removeClip(path: string, streamId: string | undefined) {
    const clip: TClip = this.state.clips[path];
    if (!clip) {
      console.warn(`Clip not found for path: ${path}`);
      return;
    }
    if (
      fileExists(path) &&
      streamId &&
      clip.streamInfo &&
      Object.keys(clip.streamInfo).length > 1
    ) {
      const updatedStreamInfo = { ...clip.streamInfo };
      delete updatedStreamInfo[streamId];

      this.state.updateClip({
        path: clip.path,
        streamInfo: updatedStreamInfo,
      });
    } else {
      this.state.removeClip(path);
      removeScrubFile(clip.scrubSprite);
      delete this.renderingClips[path];
    }

    if (clip.streamInfo !== undefined || streamId !== undefined) {
      // if we are passing a streamId, only check if we need to remove the specific streamIds stream
      // If we are not passing a streamId, check if we need to remove the streams the clip was part of
      const ids: string[] = streamId ? [streamId] : Object.keys(clip.streamInfo ?? {});
      const length = this.state.clipsArray.length;

      ids.forEach(id => {
        let found = false;
        if (length !== 0) {
          for (let i = 0; i < length; i++) {
            if (this.state.clipsArray[i].streamInfo?.[id] !== undefined) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          this.state.removeHighlightedStream(id);
        }
      });
    }
  }

  getClips(clips: TClip[], streamId?: string): TClip[] {
    return clips.filter(clip => {
      if (clip.path === 'add') {
        return false;
      }
      const exists = fileExists(clip.path);
      if (!exists) {
        this.removeClip(clip.path, streamId);
        return false;
      }
      if (streamId) {
        return clip.streamInfo?.[streamId];
      }
      return true;
    });
  }

  getClipsLoaded(clips: TClip[], streamId?: string): boolean {
    return this.getClips(clips, streamId).every(clip => clip.loaded);
  }

  hasUnloadedClips(streamId: string) {
    return !this.state.clipsArray
      .filter(clip => {
        if (!clip.enabled) return false;
        if (!streamId) return true;
        return clip.streamInfo && clip.streamInfo[streamId] !== undefined;
      })
      .every(clip => clip.loaded);
  }

  enableOnlySpecificClips(clips: TClip[], streamId?: string) {
    clips.forEach(clip => {
      this.state.updateClip({
        path: clip.path,
        enabled: false,
      });
    });

    // Enable specific clips
    const clipsToEnable = this.getClips(clips, streamId);
    clipsToEnable.forEach(clip => {
      this.state.updateClip({
        path: clip.path,
        enabled: true,
      });
    });
  }
  // This sorts all clips (replayBuffer and aiClips) by initialStartTime
  // That will assure that replayBuffer clips are also sorted in correctly in the stream
  sortStreamClipsByStartTime(clips: TClip[], newStreamInfo: IStreamInfoForAiHighlighter) {
    const allClips = this.getClips(clips, newStreamInfo.id);

    const sortedClips = allClips.sort(
      (a, b) =>
        (a.streamInfo?.[newStreamInfo.id]?.initialStartTime || 0) -
        (b.streamInfo?.[newStreamInfo.id]?.initialStartTime || 0),
    );

    // Update order positions based on the sorted order
    sortedClips.forEach((clip, index) => {
      this.state.updateClip({
        path: clip.path,
        streamInfo: {
          [newStreamInfo.id]: {
            ...(clip.streamInfo?.[newStreamInfo.id] ?? {}),
            orderPosition: index,
          },
        },
      });
    });
    return;
  }
  //* =============================================
  // STREAM
  //* =============================================

  // TODO M: Temp way to solve the issue
  addStream(streamInfo: IHighlightedStream) {
    return new Promise<void>(resolve => {
      this.state.addHighlightedStream(streamInfo);
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  removeStream(streamId: string) {
    this.state.removeHighlightedStream(streamId);
    //Remove clips from stream
    const clipsToRemove = this.getClips(this.state.clipsArray, streamId);
    clipsToRemove.forEach(clip => {
      this.removeClip(clip.path, streamId);
    });
  }
  updateStream(streamInfo: IHighlightedStream) {
    this.state.updateHighlightedStream(streamInfo);
  }

  //* =============================================
  // EXPORT
  //* =============================================
  /**
   * Exports the video using the currently configured settings
   * Return true if the video was exported, or false if not.
   */
  async export(
    preview = false,
    streamId: string | undefined = undefined,
    orientation: TOrientation = 'horizontal',
  ) {
    this.resetRenderingClips();
    await this.loadClips(streamId);

    if (this.hasUnloadedClips(streamId)) {
      console.error('Highlighter: Export called while clips are not fully loaded!: ');
      return;
    }

    if (this.state.export.exporting) {
      console.error('Highlighter: Cannot export until current export operation is finished');
      return;
    }
    this.state.export.update({
      exporting: true,
      currentFrame: 0,
      step: EExportStep.AudioMix,
      cancelRequested: false,
      error: null,
    });

    let renderingClips: RenderingClip[] = await this.generateRenderingClips(streamId, orientation);
    const exportOptions: IExportOptions = this.generateExportOptions(
      renderingClips,
      preview,
      orientation,
    );

    // Reset all clips
    await pmap(renderingClips, c => c.reset(exportOptions), {
      onProgress: c => {
        if (c.deleted) {
          this.state.updateClip({ path: c.sourcePath, deleted: true });
        }
      },
    });

    // TODO: For now, just remove deleted clips from the video
    // In the future, abort export and surface error to the user.
    renderingClips = renderingClips.filter(c => !c.deleted);

    if (!renderingClips.length) {
      console.error('Highlighter: Export called without any clips!');
      this.state.export.update({
        exporting: false,
        exported: false,
        error: $t('Please select at least one clip to export a video'),
      });
      return;
    }

    const setExportInfo = (partialExportInfo: Partial<IExportInfo>) => {
      this.state.export.update(partialExportInfo);
    };
    const recordAnalyticsEvent = (type: TAnalyticsEvent, data: Record<string, unknown>) => {
      this.usageStatisticsService.recordAnalyticsEvent(type, data);
    };
    const handleFrame = (currentFrame: number) => {
      this.setCurrentFrame(currentFrame);
    };

    startRendering(
      {
        isPreview: preview,
        renderingClips,
        exportInfo: { ...this.state.export } as IExportInfo,
        exportOptions,
        audioInfo: this.state.audio,
        transitionDuration: this.state.transition.duration,
        transition: { ...this.state.transition } as ITransitionInfo,
        useAiHighlighter: this.state.useAiHighlighter,
      },
      handleFrame,
      setExportInfo,
      recordAnalyticsEvent,
    );

    this.state.upload.update({ videoId: null });
  }

  private generateExportOptions(
    renderingClips: RenderingClip[],
    preview: boolean,
    orientation: string,
  ) {
    const exportOptions: IExportOptions = preview
      ? { width: 1280 / 4, height: 720 / 4, fps: 30, preset: 'ultrafast' }
      : {
          width: this.state.export.resolution === 720 ? 1280 : 1920,
          height: this.state.export.resolution === 720 ? 720 : 1080,
          fps: this.state.export.fps as TFPS,
          preset: this.state.export.preset as TPreset,
        };

    if (orientation === 'vertical') {
      // adds complex filter and flips width and height
      addVerticalFilterToExportOptions(this.state.clipsArray, renderingClips, exportOptions);
    }
    return exportOptions;
  }

  private async generateRenderingClips(streamId: string, orientation: string) {
    let renderingClips: RenderingClip[] = [];

    if (streamId) {
      renderingClips = this.getClips(this.state.clipsArray, streamId)
        .filter(
          clip =>
            !!clip && clip.enabled && clip.streamInfo && clip.streamInfo[streamId] !== undefined,
        )
        .sort(
          (a: TClip, b: TClip) =>
            (a.streamInfo?.[streamId]?.orderPosition ?? 0) -
            (b.streamInfo?.[streamId]?.orderPosition ?? 0),
        )
        .map(c => {
          const clip = this.renderingClips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    } else {
      renderingClips = this.state.clipsArray
        .filter(c => c.enabled)
        .sort((a: TClip, b: TClip) => a.globalOrderPosition - b.globalOrderPosition)
        .map(c => {
          const clip = this.renderingClips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    }

    if (this.state.video.intro.path && orientation !== 'vertical') {
      const intro: RenderingClip = new RenderingClip(this.state.video.intro.path);
      await intro.init();
      intro.startTrim = 0;
      intro.endTrim = 0;
      renderingClips.unshift(intro);
    }
    if (this.state.video.outro.path && orientation !== 'vertical') {
      const outro = new RenderingClip(this.state.video.outro.path);
      await outro.init();
      outro.startTrim = 0;
      outro.endTrim = 0;
      renderingClips.push(outro);
    }
    return renderingClips;
  }

  // We throttle because this can go extremely fast, especially on previews
  @throttle(100)
  private setCurrentFrame(frame: number) {
    // Avoid a race condition where we reset the exported flag
    if (this.state.export.exported) return;
    this.state.export.update({ currentFrame: frame });
  }

  cancelExport() {
    this.state.export.update({ cancelRequested: true });
  }

  resetRenderingClips() {
    this.renderingClips = {};
  }
  //* =============================================
  //* AI-HIGHLIGHTER
  //* =============================================

  setAiHighlighter(state: boolean) {
    this.state.setUseAiHighlighter(state);
    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
      type: 'Toggled',
      value: state,
    });
  }

  toggleAiHighlighter() {
    if (this.state.useAiHighlighter) {
      this.state.setUseAiHighlighter(false);
    } else {
      this.state.setUseAiHighlighter(true);
    }
  }

  async installAiHighlighter(downloadNow: boolean = false) {
    this.setAiHighlighter(true);
    if (downloadNow) {
      await this.aiHighlighterUpdater.isNewVersionAvailable();
      this.startUpdater();
    } else {
      // Only for go live view to immediately show the toggle. For other flows, the updater will set the version
      this.state.setHighlighterVersion('0.0.0');
    }
  }

  async uninstallAiHighlighter() {
    this.setAiHighlighter(false);
    this.state.setHighlighterVersion('');

    await this.aiHighlighterUpdater?.uninstall();
  }

  /**
   * Start updater process
   */
  async startUpdater() {
    try {
      this.state.setUpdaterState(true);
      this.state.setHighlighterVersion(this.aiHighlighterUpdater.version || '');
      await this.aiHighlighterUpdater.update(progress => this.updateProgress(progress));
    } finally {
      this.state.setUpdaterState(false);
    }
  }
  private updateProgress(progress: IDownloadProgress) {
    // this is a lie and its not a percent, its float from 0 and 1
    this.state.setUpdaterProgress(progress.percent * 100);
  }

  cancelHighlightGeneration(streamId: string): void {
    const stream = this.state.highlightedStreams.find(s => s.id === streamId);
    if (stream && stream.abortController) {
      console.log('cancelHighlightGeneration', streamId);
      stream.abortController.abort();
    }
  }

  async restartAiDetection(filePath: string, streamInfo: IHighlightedStream) {
    this.removeStream(streamInfo.id);

    const milestonesPath = await this.prepareMilestonesFile(streamInfo.id);

    const streamInfoForHighlighter: IStreamInfoForAiHighlighter = {
      id: streamInfo.id,
      title: streamInfo.title,
      game: streamInfo.game,
      milestonesPath,
    };

    this.detectAndClipAiHighlights(filePath, streamInfoForHighlighter);
  }

  async detectAndClipAiHighlights(
    filePath: string,
    streamInfo: IStreamInfoForAiHighlighter,
  ): Promise<void> {
    if (this.aiHighlighterFeatureEnabled === false) {
      console.log('HighlighterService: Not enabled');
      return;
    }

    // if update is already in progress, need to wait until it's done
    if (this.aiHighlighterUpdater.updateInProgress) {
      await this.aiHighlighterUpdater.currentUpdate;
    } else if (await this.aiHighlighterUpdater.isNewVersionAvailable()) {
      await this.startUpdater();
    }

    const fallbackTitle = 'awesome-stream';
    const sanitizedTitle = streamInfo.title
      ? streamInfo.title.replace(/[\\/:"*?<>|]+/g, ' ')
      : extractDateTimeFromPath(filePath) || fallbackTitle;

    const setStreamInfo: IHighlightedStream = {
      state: {
        type: EAiDetectionState.IN_PROGRESS,
        progress: 0,
      },
      date: moment().toISOString(),
      id: streamInfo.id || 'noId',
      title: sanitizedTitle,
      game: streamInfo.game || 'no title',
      abortController: new AbortController(),
      path: filePath,
    };

    this.streamMilestones = {
      streamId: setStreamInfo.id,
      milestones: [],
    };

    await this.addStream(setStreamInfo);

    const progressTracker = new ProgressTracker(progress => {
      setStreamInfo.state.progress = progress;
      this.updateStream(setStreamInfo);
    });

    const renderHighlights = async (partialHighlights: IHighlight[]) => {
      console.log('🔄 cutHighlightClips');
      this.updateStream(setStreamInfo);
      const clipData = await cutHighlightClips(filePath, partialHighlights, setStreamInfo);
      console.log('✅ cutHighlightClips');
      // 6. add highlight clips
      progressTracker.destroy();
      setStreamInfo.state.type = EAiDetectionState.FINISHED;
      this.updateStream(setStreamInfo);

      console.log('🔄 addClips', clipData);
      this.addAiClips(clipData, streamInfo);
      console.log('✅ addClips');
    };

    console.log('🔄 HighlighterData');
    try {
      const highlighterResponse = await getHighlightClips(
        filePath,
        renderHighlights,
        setStreamInfo.abortController!.signal,
        (progress: number) => {
          progressTracker.updateProgressFromHighlighter(progress);
        },
        streamInfo.milestonesPath,
        (milestone: IHighlighterMilestone) => {
          this.streamMilestones?.milestones?.push(milestone);
        },
      );

      this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
        type: 'Detection',
        clips: highlighterResponse.length,
        game: 'Fortnite', // hardcode for now
      });
      console.log('✅ Final HighlighterData', highlighterResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Highlight generation canceled') {
        setStreamInfo.state.type = EAiDetectionState.CANCELED_BY_USER;
      } else {
        console.error('Error in highlight generation:', error);
        setStreamInfo.state.type = EAiDetectionState.ERROR;
      }
    } finally {
      setStreamInfo.abortController = undefined;
      this.updateStream(setStreamInfo);
      // stopProgressUpdates();
    }

    return;
  }
  getRoundDetails() {
    // getRoundDetails
  }
  /**
   * Create milestones file if ids match and return path
   */
  private async prepareMilestonesFile(streamId: string): Promise<string | undefined> {
    if (
      !this.streamMilestones ||
      this.streamMilestones.streamId !== streamId ||
      this.streamMilestones.milestones.length === 0
    ) {
      return;
    }

    const milestonesPath = path.join(
      AiHighlighterUpdater.basepath,
      'milestones',
      'milestones.json',
    );

    const milestonesData = JSON.stringify(this.streamMilestones.milestones);
    await fs.outputFile(milestonesPath, milestonesData);

    return milestonesPath;
  }
  //* =============================================
  //* UPLOAD
  //* =============================================

  cancelFunction: (() => void) | null = null;
  /**
   * Will cancel the currently in progress upload
   */
  cancelUpload() {
    if (this.cancelFunction && this.state.upload.uploading) {
      this.state.upload.update({ cancelRequested: true });
      this.cancelFunction();
    }
  }

  clearUpload() {
    this.state.upload.clear();
  }

  async uploadYoutube(options: IYoutubeVideoUploadOptions) {
    if (!this.userService.state.auth?.platforms.youtube) {
      throw new Error('Cannot upload without YT linked');
    }

    if (!this.state.export.exported) {
      throw new Error('Cannot upload when export is not complete');
    }

    if (this.state.upload.uploading) {
      throw new Error('Cannot start a new upload when uploading is in progress');
    }

    this.state.upload.update({ uploading: true, cancelRequested: false, error: false });

    const yt = getPlatformService('youtube') as YoutubeService;

    const { cancel, complete } = yt.uploader.uploadVideo(
      this.state.export.file,
      options,
      progress => {
        this.state.upload.update({
          uploadedBytes: progress.uploadedBytes,
          totalBytes: progress.totalBytes,
        });
      },
    );

    this.cancelFunction = cancel;
    let result: IYoutubeUploadResponse | null = null;

    try {
      result = await complete;
    } catch (e: unknown) {
      if (this.state.upload.cancelRequested) {
        console.log('The upload was canceled');
      } else {
        Sentry.withScope(scope => {
          scope.setTag('feature', 'highlighter');
          console.error('Got error uploading YT video', e);
        });

        this.state.upload.update({ error: true });
        this.usageStatisticsService.recordAnalyticsEvent(
          this.state.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
          {
            type: 'UploadYouTubeError',
          },
        );
      }
    }

    this.cancelFunction = null;
    this.state.upload.update({
      uploading: false,
      cancelRequested: false,
      videoId: result ? result.id : null,
    });

    if (result) {
      this.usageStatisticsService.recordAnalyticsEvent(
        this.state.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
        {
          type: 'UploadYouTubeSuccess',
          privacy: options.privacyStatus,
          videoLink:
            options.privacyStatus === 'public'
              ? `https://youtube.com/watch?v=${result.id}`
              : undefined,
        },
      );
    }
  }

  async uploadStorage(platform: string) {
    this.state.upload.update({ uploading: true, cancelRequested: false, error: false });

    const { cancel, complete, size } = await this.sharedStorageService.actions.return.uploadFile(
      this.state.export.file,
      progress => {
        this.state.upload.update({
          uploadedBytes: progress.uploadedBytes,
          totalBytes: progress.totalBytes,
        });
      },
      error => {
        this.state.upload.update({ error: true });
        console.error(error);
      },
    );
    this.cancelFunction = cancel;
    let id;
    try {
      const result = await complete;
      id = result.id;
    } catch (e: unknown) {
      if (this.state.upload.cancelRequested) {
        console.log('The upload was canceled');
      } else {
        this.state.upload.update({ uploading: false, error: true });
        this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
          type: 'UploadStorageError',
          fileSize: size,
          platform,
        });
      }
    }
    this.cancelFunction = null;
    this.state.upload.update({ uploading: false, cancelRequested: false, videoId: id || null });

    if (id) {
      this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
        type: 'UploadStorageSuccess',
        fileSize: size,
        platform,
      });
    }

    return id;
  }
}
