import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';

export class FitToScreenCommand extends ModifyTransformCommand {
  get description() {
    return $t('Fit %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
  }

  modifyTransform() {
    this.selection.fitToScreen();
  }
}
