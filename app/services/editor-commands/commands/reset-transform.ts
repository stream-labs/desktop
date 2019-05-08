import { ModifyTransformCommand } from './modify-transform';

export class ResetTransformCommand extends ModifyTransformCommand {
  modifyTransform() {
    this.selection.resetTransform();
  }
}
