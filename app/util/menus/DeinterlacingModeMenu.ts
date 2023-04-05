import { Menu } from './Menu';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { SelectionService } from 'services/selection';
import { EditorCommandsService } from 'services/editor-commands';
import { EDeinterlaceMode, EDeinterlaceFieldOrder } from 'services/sources';

export class DeinterlacingModeMenu extends Menu {
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
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Disable,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Disable,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Discard'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Discard,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Discard,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Retro'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Retro,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Retro,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Blend'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Blend,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Blend,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Blend 2x'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Blend2X,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Blend2X,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Linear'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Linear,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Linear,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Linear 2x'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Linear2X,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Linear2X,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Yadif'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Yadif,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Yadif,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Yadif 2x'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingModeCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceMode.Yadif2X,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingModeSelected(
        EDeinterlaceMode.Yadif2X,
      ),
      type: 'checkbox',
    });
    this.append({ type: 'separator' });
    this.append({
      label: $t('Top Field First'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingFieldOrderCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceFieldOrder.Top,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingFieldOrderSelected(
        EDeinterlaceFieldOrder.Top,
      ),
      type: 'checkbox',
    });
    this.append({
      label: $t('Bottom Field First'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'SetDeinterlacingFieldOrderCommand',
          this.selectionService.views.globalSelection,
          EDeinterlaceFieldOrder.Bottom,
        ),
      checked: this.selectionService.views.globalSelection.isDeinterlacingFieldOrderSelected(
        EDeinterlaceFieldOrder.Bottom,
      ),
      type: 'checkbox',
    });
  }
}
