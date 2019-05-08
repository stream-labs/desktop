import { CombinableCommand } from './combinable-command';
import { Selection } from 'services/selection';
import isEqual from 'lodash/isEqual';

export class ResizeItemsCommand extends CombinableCommand {
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

  shouldCombine(other: ResizeItemsCommand) {
    return (
      other.selection.sceneId === this.selection.sceneId &&
      isEqual(other.selection.getIds(), this.selection.getIds())
    );
  }

  combine(other: ResizeItemsCommand) {
    this.deltaPosition.x += other.deltaPosition.x;
    this.deltaPosition.y += other.deltaPosition.y;
  }
}
