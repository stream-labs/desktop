import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from '../ModalLayout.vue';
import BoolInput from '../shared/forms/BoolInput.vue';
import windowMixin from '../mixins/window';
import { CustomizationService } from '../../services/customization';
import { IFormInput } from '../../components/shared/forms/Input';
import { StreamingService } from '../../services/streaming';
import { WindowsService } from '../../services/windows';
import { SettingsService } from '../../services/settings';
import { $t } from '../../services/i18n';
import { OptimizedSettings } from 'services/settings/optimizer';
import { CategoryIcons } from './CategoryIcons';

@Component({
  components: {
    ModalLayout,
    BoolInput
  },
  mixins: [windowMixin]
})
export default class OptimizeNiconico extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;

  settings: OptimizedSettings = this.windowsService.getChildWindowQueryParams() as any as OptimizedSettings;
  icons = CategoryIcons;

  get doNotShowAgain(): IFormInput<boolean> {
    return {
      name: 'do_not_show_again',
      description: $t('streaming.doNotShowAgainOptimizationDialog'),
      value: this.customizationService.showOptimizationDialogForNiconico === false
    };
  }

  setDoNotShowAgain(model: IFormInput<boolean>) {
    this.customizationService.setShowOptimizationDialogForNiconico(!model.value);
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