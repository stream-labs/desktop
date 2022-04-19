import { Inject, mutation, PersistentStatefulService, ViewHandler } from 'services/core';
import { $t } from './i18n';
import { ELayout, ELayoutElement, LayoutService } from './layout';
import { ScenesService } from './scenes';
import { EObsSimpleEncoder, SettingsService } from './settings';

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
    this.setRecordingSources();
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

  private setRecordingSources() {
    this.scenesService.views.activeScene.createAndAddSource(
      $t('Screen Capture (Double-click to select)'),
      'screen_capture',
    );
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
