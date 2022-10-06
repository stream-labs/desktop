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
        text = 'Disable';
        break;
      }
      case EScaleType.Point: {
        text = 'Point';
        break;
      }
      case EScaleType.Bicubic: {
        text = 'Bicubic';
        break;
      }
      case EScaleType.Bilinear: {
        text = 'Bilinear';
        break;
      }
      case EScaleType.Lanczos: {
        text = 'Lanczos';
        break;
      }
      case EScaleType.Area: {
        text = 'Area';
        break;
      }
      default: {
        text = 'Disable';
        break;
      }
    }

    return $t(text, { sourceName: this.selection.getNodes()[0].name });
  }

  execute() {
    this.selection.setScaleFilter(this.filter);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setScaleFilter(this.initialValues[item.id]));
  }
}
