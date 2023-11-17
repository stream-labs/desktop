import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
import { EBlendingMode } from 'services/scenes';
import { Command } from './command';

export class SetBlendingModeCommand extends Command {
  private initialValues: Dictionary<EBlendingMode> = {};

  constructor(private selection: Selection, private mode: EBlendingMode) {
    super();
    this.selection.freeze();

    this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.blendingMode));
  }

  get description() {
    let text = '';
    switch (this.mode) {
      case EBlendingMode.Normal: {
        text = $t("Set blending mode 'Normal'");
        break;
      }
      case EBlendingMode.Additive: {
        text = $t("Set blending mode 'Additive'");
        break;
      }
      case EBlendingMode.Substract: {
        text = $t("Set blending mode 'Subtract'");
        break;
      }
      case EBlendingMode.Screen: {
        text = $t("Set blending mode 'Screen'");
        break;
      }
      case EBlendingMode.Multiply: {
        text = $t("Set blending mode 'Multiply'");
        break;
      }
      case EBlendingMode.Lighten: {
        text = $t("Set blending mode 'Lighten'");
        break;
      }
      case EBlendingMode.Darken: {
        text = $t("Set blending mode 'Darken'");
        break;
      }
      default: {
        text = $t("Set blending mode 'Normal'");
        break;
      }
    }

    return text;
  }

  execute() {
    this.selection.setBlendingMode(this.mode);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setBlendingMode(this.initialValues[item.id]));
  }
}
