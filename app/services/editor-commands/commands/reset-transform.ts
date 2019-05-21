import { ModifyTransformCommand } from './modify-transform';

export class ResetTransformCommand extends ModifyTransformCommand {
  get description() {
    return `Reset ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    this.selection.resetTransform();
  }
}
