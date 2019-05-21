import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export class ResizeItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private deltaScale: IVec2, private origin: IVec2) {
    super(selection);
  }

  get description() {
    return `Resize ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    this.selection.scale(this.deltaScale, this.origin);
  }
}
