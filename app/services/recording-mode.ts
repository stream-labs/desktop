import { Inject, mutation, PersistentStatefulService, ViewHandler } from 'services/core';
import { SourcesService } from './sources';
import { $t } from './i18n';
import { ELayout, ELayoutElement, LayoutService } from './layout';
import { ScenesService } from './scenes';
import { EObsSimpleEncoder, SettingsService } from './settings';
import { AnchorPoint, ScalableRectangle } from 'util/ScalableRectangle';
import { VideoService } from './video';
import { DefaultHardwareService } from './hardware';
import { RunInLoadingMode } from './app/app-decorators';
import { byOS, OS } from 'util/operating-systems';

interface IRecordingModeState {
  enabled: boolean;
}

class RecordingModeViews extends ViewHandler<IRecordingModeState> {
  get isRecordingModeEnabled() {
    return this.state.enabled;
  }
}

export class RecordingModeService extends PersistentStatefulService<IRecordingModeState> {
  @Inject() private layoutService: LayoutService;
  @Inject() private scenesService: ScenesService;
  @Inject() private settingsService: SettingsService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private videoService: VideoService;
  @Inject() private defaultHardwareService: DefaultHardwareService;

  static defaultState: IRecordingModeState = {
    enabled: false,
  };

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
  private SET_RECORDING_MODE(val: boolean) {
    this.state.enabled = val;
  }
}
