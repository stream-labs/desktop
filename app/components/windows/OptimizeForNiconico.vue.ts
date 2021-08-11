import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import BoolInput from 'components/obs/inputs/ObsBoolInput.vue';
import { CustomizationService } from '../../services/customization';
import { IObsInput } from 'components/obs/inputs/ObsInput';
import { StreamingService } from '../../services/streaming';
import { WindowsService } from '../../services/windows';
import { SettingsService } from '../../services/settings';
import { $t } from '../../services/i18n';
import { OptimizedSettings } from 'services/settings/optimizer';
import { CategoryIcons } from './CategoryIcons';

@Component({
  components: {
    ModalLayout,
    BoolInput,
  },
})
export default class OptimizeNiconico extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;

  settings: OptimizedSettings =
    this.windowsService.getChildWindowQueryParams() as any as OptimizedSettings;
  icons = CategoryIcons;

  get doNotShowAgain(): IObsInput<boolean> {
    return {
      name: 'do_not_show_again',
      description: $t('streaming.doNotShowAgainOptimizationDialog'),
      value: this.customizationService.showOptimizationDialogForNiconico === false,
    };
  }

  setDoNotShowAgain(model: IObsInput<boolean>) {
    this.customizationService.setShowOptimizationDialogForNiconico(!model.value);
  }

  get useHardwareEncoder(): IObsInput<boolean> {
    return {
      name: 'use_hardware_encoder',
      description: $t('streaming.optimizeWithHardwareEncoder'),
      value: this.customizationService.optimizeWithHardwareEncoder === true,
    };
  }

  setUseHardwareEncoder(model: IObsInput<boolean>) {
    this.customizationService.setOptimizeWithHardwareEncoder(model.value);
    // close the dialog and open again to apply new optimization settings
    this.windowsService.closeChildWindow();
    this.streamingService.toggleStreamingAsync({ mustShowOptimizationDialog: true });
  }

  optimizeAndGoLive() {
    this.settingsService.optimizeForNiconico(this.settings.best);
    this.streamingService.toggleStreaming();
    this.windowsService.closeChildWindow();
  }

  skip() {
    if (this.doNotShowAgain.value) {
      this.customizationService.setOptimizeForNiconico(false);
    }
    this.streamingService.toggleStreaming();
    this.windowsService.closeChildWindow();
  }
}
