import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
import { EDeinterlaceMode } from 'services/sources';
import { Command } from './command';

export class SetDeinterlacingModeCommand extends Command {
  private initialValues: Dictionary<EDeinterlaceMode> = {};

  constructor(private selection: Selection, private mode: EDeinterlaceMode) {
    super();
    this.selection.freeze();

    this.selection
      .getItems()
      .forEach(item => (this.initialValues[item.id] = item.source.deinterlaceMode));
  }

  get description() {
    let text = '';
    switch (this.mode) {
      case EDeinterlaceMode.Disable: {
        text = $t("Set deinterlacing 'Disable'");
        break;
      }
      case EDeinterlaceMode.Discard: {
        text = $t("Set deinterlacing 'Discard'");
        break;
      }
      case EDeinterlaceMode.Retro: {
        text = $t("Set deinterlacing 'Retro'");
        break;
      }
      case EDeinterlaceMode.Blend: {
        text = $t("Set deinterlacing 'Blend'");
        break;
      }
      case EDeinterlaceMode.Blend2X: {
        text = $t("Set deinterlacing 'Blend 2x'");
        break;
      }
      case EDeinterlaceMode.Linear: {
        text = $t("Set deinterlacing 'Linear'");
        break;
      }
      case EDeinterlaceMode.Linear2X: {
        text = $t("Set deinterlacing 'Linear 2x'");
        break;
      }
      case EDeinterlaceMode.Yadif: {
        text = $t("Set deinterlacing 'Yadif'");
        break;
      }
      case EDeinterlaceMode.Yadif2X: {
        text = $t("Set deinterlacing 'Yadif 2x'");
        break;
      }
      default: {
        text = $t("Set deinterlacing 'Normal'");
        break;
      }
    }

    return text;
  }

  execute() {
    this.selection.setDeinterlaceMode(this.mode);
  }

  rollback() {
    this.selection
      .getItems()
      .forEach(item => item.source.setDeinterlaceMode(this.initialValues[item.id]));
  }
}
