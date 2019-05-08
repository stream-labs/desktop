import { CombinableCommand } from './combinable-command';
import { ITransform, SceneItem, IPartialTransform } from 'services/scenes';
import { Selection } from 'services/selection';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

export abstract class ModifyTransformCommand extends CombinableCommand {
  startTransforms: Dictionary<ITransform> = {};
  endTransforms: Dictionary<ITransform> = {};

  constructor(protected selection: Selection) {
    super();
    this.selection.getItems().forEach(item => {
      this.startTransforms[item.id] = cloneDeep(item.state.transform);
    });
  }

  protected setTransform(item: SceneItem, transform: IPartialTransform) {
    // If we already have an end transform, use that instead, since this is
    // a redo operation.
    if (this.endTransforms[item.id]) {
      item.setTransform(this.endTransforms[item.id]);
    } else {
      item.setTransform(transform);
      this.endTransforms[item.id] = cloneDeep(item.state.transform);
    }
  }

  rollback() {
    this.selection.getItems().forEach(item => {
      item.setTransform(this.startTransforms[item.id]);
    });
  }

  shouldCombine(other: ModifyTransformCommand) {
    return (
      other.selection.sceneId === this.selection.sceneId &&
      isEqual(other.selection.getIds(), this.selection.getIds())
    );
  }

  combine(other: ModifyTransformCommand) {
    this.endTransforms = other.endTransforms;
  }
}
