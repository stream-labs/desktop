import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { SelectionService } from 'services/selection';
import { EditorCommandsService } from 'services/editor-commands';
import { EBlendingMode } from 'services/scenes';

export class BlendingModeMenu extends Menu {
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      label: $t('Normal'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Normal,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Normal,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Additive'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Additive,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Additive,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Substract'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Substract,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Substract,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Screen'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Screen,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Screen,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Multiply'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Multiply,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Multiply,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Lighten'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Lighten,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Lighten,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Darken'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetBlendingModeCommand',
          this.selectionService.views.globalSelection,
          EBlendingMode.Darken,
        ),
      checked: this.selectionService.views.globalSelection.isBlendingModeSelected(
        EBlendingMode.Darken,
      ),
      type: 'checkbox',
    });
  }
}
