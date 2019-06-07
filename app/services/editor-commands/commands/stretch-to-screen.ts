import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';

export class StretchToScreenCommand extends ModifyTransformCommand {
  get description() {
    return $t('Stretch %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
  }

  modifyTransform() {
    this.selection.stretchToScreen();
  }
}
