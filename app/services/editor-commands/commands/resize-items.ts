import { ModifyTransformCommand } from './modify-transform';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';

export class ResizeItemsCommand extends ModifyTransformCommand {
  constructor(selection: Selection, private deltaScale: IVec2, private origin: IVec2) {
    super(selection);
  }

  get description() {
    return $t('Resize %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
  }

  modifyTransform() {
    this.selection.scale(this.deltaScale, this.origin);
  }
}
