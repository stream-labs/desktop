import Vue from 'vue';
import moment from 'moment';
import * as Sentry from '@sentry/browser';
import { Inject, mutation, PersistentStatefulService, ViewHandler, Service } from 'services/core';
import { SourcesService } from './sources';
import { $t } from './i18n';
import { ELayout, ELayoutElement, LayoutService } from './layout';
import { ScenesService } from './scenes';
import { EObsSimpleEncoder, SettingsService } from './settings';
import { AnchorPoint, ScalableRectangle } from 'util/ScalableRectangle';
import { VideoService } from './video';
import { ENotificationType, NotificationsService } from 'services/notifications';
import { DefaultHardwareService } from './hardware';
import { RunInLoadingMode } from './app/app-decorators';
import { byOS, OS } from 'util/operating-systems';
import { JsonrpcService } from './api/jsonrpc';
import { WindowsService, UsageStatisticsService } from 'app-services';
import { getPlatformService } from 'services/platforms';
import { IYoutubeUploadResponse } from 'services/platforms/youtube/uploader';
import { YoutubeService } from 'services/platforms/youtube';

interface IRecordingEntry {
  timestamp: string;
  filename: string;
}

export interface IUploadInfo {
  uploadedBytes?: number;
  totalBytes?: number;
}

interface IRecordingModeState {
  enabled: boolean;
  recordingHistory: Dictionary<IRecordingEntry>;
  uploadInfo: IUploadInfo;
}

class RecordingModeViews extends ViewHandler<IRecordingModeState> {
  get isRecordingModeEnabled() {
    return this.state.enabled;
  }

  get sortedRecordings() {
    return Object.values(this.state.recordingHistory).sort((a, b) =>
      moment(a.timestamp).isAfter(moment(b.timestamp)) ? -1 : 1,
    );
  }

  formattedTimestamp(timestamp: string) {
    return moment(timestamp).fromNow();
  }
}

export class RecordingModeService extends PersistentStatefulService<IRecordingModeState> {
  @Inject() private layoutService: LayoutService;
  @Inject() private scenesService: ScenesService;
  @Inject() private settingsService: SettingsService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private videoService: VideoService;
  @Inject() private defaultHardwareService: DefaultHardwareService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;
  @Inject() private usageStatisticsService: UsageStatisticsService;
  @Inject() private windowsService: WindowsService;

  static defaultState: IRecordingModeState = {
    enabled: false,
    recordingHistory: {},
    uploadInfo: {} as IUploadInfo,
  };

  static filter(state: IRecordingModeState) {
    return { ...state, uploadInfo: {} };
  }

  cancelFunction = () => {};

  cancelUpload() {
    this.cancelFunction();
    this.SET_UPLOAD_INFO({});
  }

  get views() {
    return new RecordingModeViews(this.state);
  }

  /**
   * When recording mode is enabled as part of onboarding, it does a handful
   * of initial setup items that differ from if you are streaming. These are
   * only ever done during onboarding from a fresh cache, and won't be
   * performed if you later enable recording mode.
   */
  setUpRecordingFirstTimeSetup() {
    this.setRecordingLayout();
    this.addRecordingCapture();
    this.setRecordingEncoder();
  }

  setRecordingMode(enabled: boolean) {
    this.SET_RECORDING_MODE(enabled);
  }

  private setRecordingLayout() {
    this.layoutService.changeLayout(ELayout.Classic);
    this.layoutService.setSlots({
      [ELayoutElement.Display]: { slot: '1' },
      [ELayoutElement.Scenes]: { slot: '2' },
      [ELayoutElement.Sources]: { slot: '3' },
      [ELayoutElement.Mixer]: { slot: '4' },
    });
    this.layoutService.setBarResize('bar1', 0.3);
  }

  private addRecordingCapture() {
    this.scenesService.views.activeScene.createAndAddSource(
      $t('Screen Capture (Double-click to select)'),
      byOS({ [OS.Windows]: 'screen_capture', [OS.Mac]: 'window_capture' }),
    );
  }

  /**
   * This is only done after hardware setup so that we apply the
   * correct webcam and preset filter.
   */
  @RunInLoadingMode()
  async addRecordingWebcam() {
    // Force clearing of temporary sources
    this.defaultHardwareService.clearTemporarySources();

    // This gives the backend time to release exclusive rights to the webcam
    // TODO: This really shouldn't be required to be a race condition.
    await new Promise(r => {
      setTimeout(r, 2000);
    });

    const item = this.scenesService.views.activeScene.createAndAddSource(
      'Webcam',
      byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' }),
    );

    let sub = this.sourcesService.sourceUpdated.subscribe(s => {
      if (s.sourceId === item.source.sourceId && s.width && s.height) {
        sub.unsubscribe();
        sub = null;

        // Create a rect to represent the source
        const rect = new ScalableRectangle({ x: 0, y: 0, width: s.width, height: s.height });

        // Scale width to approximately 25% of canvas width
        rect.scaleX = (this.videoService.baseWidth / rect.width) * 0.25;

        // Scale height to match
        rect.scaleY = rect.scaleX;

        // Move to just near bottom left corner
        rect.withAnchor(AnchorPoint.SouthWest, () => {
          rect.x = 20;
          rect.y = this.videoService.baseHeight - 20;
        });

        item.setTransform({
          position: { x: rect.x, y: rect.y },
          scale: { x: rect.scaleX, y: rect.scaleY },
        });
      }
    });

    // If for some reason we don't hear about the width/height within 10
    // seconds, don't keep waiting for it to come.
    setTimeout(() => {
      if (sub) sub.unsubscribe();
    }, 10 * 1000);
  }

  addRecordingEntry(filename: string) {
    const timestamp = moment().format();
    const parsedFilename = byOS({ [OS.Mac]: filename, [OS.Windows]: filename.replace(/\//, '\\') });
    this.ADD_RECORDING_ENTRY(timestamp, parsedFilename);
    this.notificationsService.actions.push({
      type: ENotificationType.SUCCESS,
      message: $t('A new Recording has been completed. Click for more info'),
      action: this.jsonrpcService.createRequest(
        Service.getResourceId(this),
        'showRecordingHistory',
      ),
    });
  }

  pruneRecordingEntries() {
    const oneMonthAgo = moment().subtract(30, 'days');
    const prunedEntries = {};
    Object.keys(this.state.recordingHistory).forEach(timestamp => {
      if (moment(timestamp).isAfter(oneMonthAgo)) {
        prunedEntries[timestamp] = this.state.recordingHistory[timestamp];
      }
    });
    this.SET_RECORDING_ENTRIES(prunedEntries);
  }

  showRecordingHistory() {
    this.windowsService.actions.showWindow({
      componentName: 'RecordingHistory',
      title: $t('Recording History'),
      size: { width: 450, height: 600 },
    });
  }

  async uploadToYoutube(filename: string) {
    const yt = getPlatformService('youtube') as YoutubeService;

    const { cancel, complete } = yt.uploader.uploadVideo(
      filename,
      { title: filename, description: '', privacyStatus: 'private' },
      progress => {
        this.SET_UPLOAD_INFO({
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
      Sentry.withScope(scope => {
        scope.setTag('feature', 'recording-history');
        console.error('Got error uploading YT video', e);
      });

      this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
        type: 'UploadError',
      });
    }

    this.cancelFunction = () => {};
    this.SET_UPLOAD_INFO({});

    if (result) {
      this.usageStatisticsService.recordAnalyticsEvent('RecordingHistory', {
        type: 'UploadSuccess',
        privacy: 'private',
      });
    }
  }

  private setRecordingEncoder() {
    const encoderPriority: EObsSimpleEncoder[] = [
      EObsSimpleEncoder.jim_nvenc,
      EObsSimpleEncoder.amd,
      EObsSimpleEncoder.nvenc,
      EObsSimpleEncoder.x264,
    ];

    // Set these first, as they affect available options
    this.settingsService.setSettingsPatch({ Output: { Mode: 'Simple' } });
    this.settingsService.setSettingsPatch({ Output: { RecQuality: 'Small' } });

    const availableEncoders = this.settingsService
      .findSetting(this.settingsService.state.Output.formData, 'Recording', 'RecEncoder')
      .options.map((opt: { value: EObsSimpleEncoder }) => opt.value);
    const bestEncoder = encoderPriority.find(e => {
      return availableEncoders.includes(e);
    });

    this.settingsService.setSettingsPatch({
      Output: { RecEncoder: bestEncoder, RecFormat: 'mp4' },
    });
  }

  @mutation()
  private ADD_RECORDING_ENTRY(timestamp: string, filename: string) {
    Vue.set(this.state.recordingHistory, timestamp, { timestamp, filename });
  }

  @mutation()
  private SET_RECORDING_ENTRIES(entries: Dictionary<IRecordingEntry>) {
    this.state.recordingHistory = entries;
  }

  @mutation()
  private SET_RECORDING_MODE(val: boolean) {
    this.state.enabled = val;
  }

  @mutation()
  private SET_UPLOAD_INFO(info: IUploadInfo) {
    this.state.uploadInfo = info;
  }
}
