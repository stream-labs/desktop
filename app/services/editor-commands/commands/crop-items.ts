import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export class CropItemsCommand extends ModifyTransformCommand {
  /**
   * Crops a set of items
   * @param selection The selection to operation on
   * @param crop The crop to apply
   * @param position Optionally the items can be moved as well
   */
  constructor(selection: Selection, private crop: ICrop, private position?: IVec2) {
    super(selection);
  }

  modifyTransform() {
    this.selection.getItems().forEach(item => {
      item.setTransform({
        position: this.position,
        crop: this.crop,
      });
    });
  }
}
