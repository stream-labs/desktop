import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
import { EScaleType } from 'services/scenes';
import { Command } from './command';

export class SetScaleFilterCommand extends Command {
  private initialValues: Dictionary<EScaleType> = {};

  constructor(private selection: Selection, private filter: EScaleType) {
    super();
    this.selection.freeze();

    this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.scaleFilter));
  }

  get description() {
    let text = '';
    switch (this.filter) {
      case EScaleType.Disable: {
        text = $t("Set scale filter 'Disable'");
        break;
      }
      case EScaleType.Point: {
        text = $t("Set scale filter 'Point'");
        break;
      }
      case EScaleType.Bicubic: {
        text = $t("Set scale filter 'Bicubic'");
        break;
      }
      case EScaleType.Bilinear: {
        text = $t("Set scale filter 'Bilinear'");
        break;
      }
      case EScaleType.Lanczos: {
        text = $t("Set scale filter 'Lanczos'");
        break;
      }
      case EScaleType.Area: {
        text = $t("Set scale filter 'Area'");
        break;
      }
      default: {
        text = $t("Set scale filter 'Disable'");
        break;
      }
    }

    return text;
  }

  execute() {
    this.selection.setScaleFilter(this.filter);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setScaleFilter(this.initialValues[item.id]));
  }
}
