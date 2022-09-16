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
    switch(this.mode) {
      case EBlendingMode.Normal: {
        text = 'Normal';
        break;
      }
      case EBlendingMode.Additive:{
        text = 'Additive';
        break;
      }
      case EBlendingMode.Substract:{
        text = 'Substract';
        break;
      }
      case EBlendingMode.Screen:{
        text = 'Screen';
        break;
      }
      case EBlendingMode.Multiply:{
        text = 'Multiply';
        break;
      }
      case EBlendingMode.Lighten:{
        text = 'Lighten';
        break;
      }
      case EBlendingMode.Darken:{
        text = 'Darken';
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
    this.selection.setBlendingMode(this.mode);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setBlendingMode(this.initialValues[item.id]));
  }
}
