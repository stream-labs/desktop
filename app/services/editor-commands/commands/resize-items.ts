import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export class ResizeItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private deltaScale: IVec2, private offset: IVec2) {
    super(selection);
  }

  modifyTransform() {
    this.selection.scaleWithOffset(this.deltaScale, this.offset);
  }
}
