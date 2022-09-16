import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
import { EBlendingMethod } from 'services/scenes';
import { Command } from './command';

export class SetBlendingMethodCommand extends Command {
  private initialValues: Dictionary<EBlendingMethod> = {};

  constructor(private selection: Selection, private mode: EBlendingMethod) {
    super();
    this.selection.freeze();

    this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.blendingMethod));
  }

  get description() {
    let text = '';
    switch(this.mode) {
      case EBlendingMethod.Default: {
        text = 'Default';
        break;
      }
      case EBlendingMethod.SrgbOff:{
        text = 'SRGB Off';
        break;
      }
      default:{
        text = 'Normal';
        break;
      }
    }

    return $t(text, { sourceName: this.selection.getNodes()[0].name });
  }

  execute() {
    this.selection.setBlendingMethod(this.mode);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setBlendingMethod(this.initialValues[item.id]));
  }
}
