import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import BoolInput from 'components/obs/inputs/ObsBoolInput.vue';
import { CustomizationService } from '../../services/customization';
import { IObsInput } from 'components/obs/inputs/ObsInput';
import { WindowsService } from '../../services/windows';
import { $t } from '../../services/i18n';

@Component({
  components: {
    ModalLayout,
    BoolInput,
  },
})
export default class AutoCompactConfirmDialog extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;

  get doNotShowAgain(): IObsInput<boolean> {
    return {
      name: 'do_not_show_again',
      description: $t('settings.autoCompact.doNotShowAgain'),
      value: this.customizationService.showOptimizationDialogForNiconico === false,
    };
  }

  setDoNotShowAgain(model: IObsInput<boolean>) {
    this.customizationService.setShowOptimizationDialogForNiconico(!model.value);
  }

  activate() {
    this.customizationService.setAutoCompatMode(true);
    this.windowsService.closeChildWindow();
  }

  skip() {
    if (this.doNotShowAgain.value) {
      this.customizationService.setShowAutoCompactDialog(false);
    }
    this.windowsService.closeChildWindow();
  }
}
