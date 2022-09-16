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

    this.selection.getItems().forEach(item => (
      this.initialValues[item.id] = item.getSource().deinterlaceMode));
  }

  get description() {
    let text = '';
    switch(this.mode) {
      case EDeinterlaceMode.Disable: {
        text = 'Disable';
        break;
      }
      case EDeinterlaceMode.Discard:{
        text = 'Discard';
        break;
      }
      case EDeinterlaceMode.Retro:{
        text = 'Retro';
        break;
      }
      case EDeinterlaceMode.Blend:{
        text = 'Blend';
        break;
      }
      case EDeinterlaceMode.Blend2X:{
        text = 'Blend 2x';
        break;
      }
      case EDeinterlaceMode.Linear:{
        text = 'Linear';
        break;
      }
      case EDeinterlaceMode.Linear2X:{
        text = 'Linear 2x';
        break;
      }
      case EDeinterlaceMode.Yadif:{
        text = 'Yadif';
        break;
      }
      case EDeinterlaceMode.Yadif2X:{
        text = 'Yadif 2x';
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
    this.selection.setDeinterlaceMode(this.mode);
  }

  rollback() {
    this.selection.getItems().forEach(item =>
      item.getSource().setDeinterlaceMode(this.initialValues[item.id]));
  }
}
