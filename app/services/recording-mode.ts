import { Inject, mutation, PersistentStatefulService } from 'services/core';
import { $t } from './i18n';
import { ELayout, ELayoutElement, LayoutService } from './layout';
import { ScenesService } from './scenes';

interface IRecordingModeState {
  enabled: boolean;
}

export class RecordingModeService extends PersistentStatefulService<IRecordingModeState> {
  @Inject() private layoutService: LayoutService;
  @Inject() private scenesService: ScenesService;

  static defaultState: IRecordingModeState = {
    enabled: false,
  };

  /**
   * When recording mode is enabled as part of onboarding, it does a handful
   * of initial setup items that differ from if you are streaming. These are
   * only ever done during onboarding from a fresh cache, and won't be
   * performed if you later enable recording mode.
   */
  setUpRecordingFirstTimeSetup() {
    this.setRecordingLayout();
    this.setRecordingSources();
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
    
  }

  @mutation()
  private SET_RECORDING_MODE(val: boolean) {
    this.state.enabled = val;
  }
}
