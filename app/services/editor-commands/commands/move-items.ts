import { CombinableCommand } from './combinable-command';
import { Selection } from 'services/selection';
import isEqual from 'lodash/isEqual';

export class MoveItemsCommand extends CombinableCommand {
  constructor(private selection: Selection, private deltaPosition: IVec2) {
    super();
  }

  execute() {
    this.selection.getItems().forEach(item => {
      item.setTransform({
        position: {
          x: item.transform.position.x + this.deltaPosition.x,
          y: item.transform.position.y + this.deltaPosition.y,
        },
      });
    });
  }

  rollback() {
    this.selection.getItems().forEach(item => {
      item.setTransform({
        position: {
          x: item.transform.position.x - this.deltaPosition.x,
          y: item.transform.position.y - this.deltaPosition.y,
        },
      });
    });
  }

  shouldCombine(other: MoveItemsCommand) {
    return (
      other.selection.sceneId === this.selection.sceneId &&
      isEqual(other.selection.getIds(), this.selection.getIds())
    );
  }

  combine(other: MoveItemsCommand) {
    this.deltaPosition.x += other.deltaPosition.x;
    this.deltaPosition.y += other.deltaPosition.y;
  }
}
