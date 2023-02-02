import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { SelectionService } from 'services/selection';
import { EditorCommandsService } from 'services/editor-commands';
import { EScaleType } from 'services/scenes';

export class ScaleFilteringMenu extends Menu {
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      label: $t('Disable'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Disable,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(
        EScaleType.Disable,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Point'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Point,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(EScaleType.Point),
      type: 'checkbox',
    });
    this.append({
      label: $t('Bicubic'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Bicubic,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(
        EScaleType.Bicubic,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Bilinear'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Bilinear,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(
        EScaleType.Bilinear,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Lanczos'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Lanczos,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(
        EScaleType.Lanczos,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Area'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetScaleFilterCommand',
          this.selectionService.views.globalSelection,
          EScaleType.Area,
        ),
      checked: this.selectionService.views.globalSelection.isScaleFilterSelected(EScaleType.Area),
      type: 'checkbox',
    });
  }
}
