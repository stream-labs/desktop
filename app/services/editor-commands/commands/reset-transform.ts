import { ModifyTransformCommand } from './modify-transform';
import { $t } from 'services/i18n';

export class ResetTransformCommand extends ModifyTransformCommand {
  get description() {
    return $t('Reset %{sourceName}', { sourceName: this.selection.getNodes()[0].name });
  }

  modifyTransform() {
    this.selection.resetTransform();
  }
}
