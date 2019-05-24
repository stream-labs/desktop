import { ModifyTransformCommand } from './modify-transform';

export class StretchToScreenCommand extends ModifyTransformCommand {
  get description() {
    return `Stretch ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    this.selection.stretchToScreen();
  }
}
