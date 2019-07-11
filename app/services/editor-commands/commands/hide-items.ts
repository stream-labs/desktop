import { Command } from './command';
import { Selection } from 'services/selection';
import { $t } from 'services/i18n';

export class HideItemsCommand extends Command {
  private initialValues: Dictionary<boolean> = {};
  description: string;

  constructor(private selection: Selection, private hidden: boolean) {
    super();
    const action = hidden ? 'Hide %{sourceName}' : 'Show %{sourceName}';
    this.description = $t(action, { sourceName: this.selection.getNodes()[0].name });

    this.selection.getItems().forEach(item => (this.initialValues[item.id] = item.visible));
  }

  execute() {
    this.selection.setVisibility(!this.hidden);
  }

  rollback() {
    this.selection.getItems().forEach(item => item.setVisibility(this.initialValues[item.id]));
  }
}
