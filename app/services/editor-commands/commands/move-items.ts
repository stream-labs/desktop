import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export class MoveItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private deltaPosition: IVec2) {
    super(selection);
  }

  modifyTransform() {
    this.selection.getItems().forEach(item => {
      item.setTransform({
        position: {
          x: item.transform.position.x + this.deltaPosition.x,
          y: item.transform.position.y + this.deltaPosition.y,
        },
      });
    });
  }
}
