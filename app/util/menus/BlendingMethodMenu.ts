import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { SelectionService } from 'services/selection';
import { EditorCommandsService } from 'services/editor-commands';
import { EBlendingMethod } from 'services/scenes';

export class BlendingMethodMenu extends Menu {
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      label: $t('Default'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingMethodCommand',
          this.selectionService.views.globalSelection,
          EBlendingMethod.Default,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingMethodSelected(
        EBlendingMethod.Default,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('SRGB Off'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingMethodCommand',
          this.selectionService.views.globalSelection,
          EBlendingMethod.SrgbOff,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingMethodSelected(
        EBlendingMethod.SrgbOff,
      ),
      type: 'checkbox',
    });
  }
}
