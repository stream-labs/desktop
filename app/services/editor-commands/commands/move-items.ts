import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export class MoveItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private deltaPosition: Partial<IVec2>) {
    super(selection);
  }

  get description() {
    return `Move ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    this.selection.getItems().forEach(item => {
      item.setTransform({
        position: {
          x: item.transform.position.x + (this.deltaPosition.x || 0),
          y: item.transform.position.y + (this.deltaPosition.y || 0),
        },
      });
    });
  }
}
