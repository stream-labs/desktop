import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';

export enum ECenteringType {
  Screen = 'screen',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export class CenterItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private centeringType: ECenteringType) {
    super(selection);
  }

  modifyTransform() {
    switch (this.centeringType) {
      case ECenteringType.Screen:
        this.selection.centerOnScreen();
        break;
      case ECenteringType.Horizontal:
        this.selection.centerOnHorizontal();
        break;
      case ECenteringType.Vertical:
        this.selection.centerOnVertical();
        break;
    }
  }
}
