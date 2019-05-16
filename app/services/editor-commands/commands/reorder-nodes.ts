import { Command } from './command';
import { Selection } from 'services/selection';

export enum EPlaceType {
  After = 'after',
  Before = 'before',
  Inside = 'inside',
}

export class ReorderNodesCommand extends Command {
  initialNodeOrder: string[];
  initialParentMap: Dictionary<string> = {};

  constructor(
    private selection: Selection,
    private destinationId: string,
    private placeType: EPlaceType,
  ) {
    super();
    this.initialNodeOrder = this.selection.getScene().getNodesIds();
    this.selection.getNodes().forEach(node => {
      this.initialParentMap[node.id] = node.parentId;
    });
  }

  get description() {
    return `Reorder ${this.selection.getNodes()[0].name}`;
  }

  execute() {
    switch (this.placeType) {
      case EPlaceType.After:
        this.selection.placeAfter(this.destinationId);
        break;
      case EPlaceType.Before:
        this.selection.placeBefore(this.destinationId);
        break;
      case EPlaceType.Inside:
        this.selection.setParent(this.destinationId);
        break;
    }
  }

  rollback() {
    // TODO: This is a fairly slow way to rollback this operation, but
    // significantly cuts down on excess business logic.
    this.selection.getNodes().forEach(node => {
      node.setParent(this.initialParentMap[node.id]);
    });
    this.selection.getScene().setNodesOrder(this.initialNodeOrder);
  }
}
