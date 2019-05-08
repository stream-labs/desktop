import { ModifyTransformCommand } from './modify-transform';

export class StretchToScreenCommand extends ModifyTransformCommand {
  modifyTransform() {
    this.selection.stretchToScreen();
  }
}
