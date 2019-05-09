import { ModifyTransformCommand } from './modify-transform';

export class FitToScreenCommand extends ModifyTransformCommand {
  get description() {
    return `Fit ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    this.selection.fitToScreen();
  }
}
