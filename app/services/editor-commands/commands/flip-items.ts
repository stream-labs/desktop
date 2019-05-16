import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export enum EFlipAxis {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export class FlipItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private centeringType: EFlipAxis) {
    super(selection);
  }

  get description() {
    return `Flip ${this.selection.getNodes()[0].name}`;
  }

  modifyTransform() {
    switch (this.centeringType) {
      case EFlipAxis.Vertical:
        this.selection.flipY();
        break;
      case EFlipAxis.Horizontal:
        this.selection.flipX();
        break;
    }
  }
}
