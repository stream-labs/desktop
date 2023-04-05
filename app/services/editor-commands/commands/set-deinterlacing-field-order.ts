import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';
import { EDeinterlaceFieldOrder } from 'services/sources';
import { Command } from './command';

export class SetDeinterlacingFieldOrderCommand extends Command {
  private initialValues: Dictionary<EDeinterlaceFieldOrder> = {};

  constructor(private selection: Selection, private order: EDeinterlaceFieldOrder) {
    super();
    this.selection.freeze();

    this.selection
      .getItems()
      .forEach(item => (this.initialValues[item.id] = item.source.deinterlaceFieldOrder));
  }

  get description() {
    let text = '';
    switch (this.order) {
      case EDeinterlaceFieldOrder.Top: {
        text = $t("Set deinterlacing 'Top Field First'");
        break;
      }
      case EDeinterlaceFieldOrder.Bottom: {
        text = $t("Set deinterlacing 'Bottom Field First'");
        break;
      }
      default: {
        text = $t("Set deinterlacing 'Top Field First'");
        break;
      }
    }

    return text;
  }

  execute() {
    this.selection.setDeinterlaceFieldOrder(this.order);
  }

  rollback() {
    this.selection
      .getItems()
      .forEach(item => item.source.setDeinterlaceFieldOrder(this.initialValues[item.id]));
  }
}
