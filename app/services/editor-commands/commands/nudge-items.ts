import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';

export enum ENudgeDirection {
  Up = 'up',
  Down = 'down',
  Right = 'right',
  Left = 'left',
}

export class NudgeItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private direction: ENudgeDirection) {
    super(selection);
  }

  get description() {
    return $t('Nudge %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
  }

  modifyTransform() {
    switch (this.direction) {
      case ENudgeDirection.Up:
        this.selection.nudgeUp();
        break;
      case ENudgeDirection.Down:
        this.selection.nudgeDown();
        break;
      case ENudgeDirection.Right:
        this.selection.nudgeRight();
        break;
      case ENudgeDirection.Left:
        this.selection.nudgeLeft();
        break;
    }
  }
}
