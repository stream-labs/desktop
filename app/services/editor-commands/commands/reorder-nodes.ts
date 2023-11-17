import { Command } from './command';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';

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
    this.selection.freeze();
    this.initialNodeOrder = this.selection.getScene().getNodesIds();
    this.selection.getNodes().forEach(node => {
      this.initialParentMap[node.id] = node.parentId;
    });
  }

  get description() {
    return $t('Reorder %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
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
    const nodes = this.selection.getNodes();
    if (nodes.length > 0) {
      this.selection.getNodes().forEach(node => {
        node.setParent(this.initialParentMap[node.id]);
      });
      this.selection.getScene().setNodesOrder(this.initialNodeOrder);
    }
  }
}
