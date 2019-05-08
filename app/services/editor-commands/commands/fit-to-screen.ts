import { ModifyTransformCommand } from './modify-transform';

export class FitToScreenCommand extends ModifyTransformCommand {
  modifyTransform() {
    this.selection.fitToScreen();
  }
}
