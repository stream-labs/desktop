import { Menu } from './Menu';
import { SelectionService } from 'services/selection';
import { Inject } from 'util/injector';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';
import { ECenteringType } from 'services/editor-commands/commands/center-items';
import { EFlipAxis } from 'services/editor-commands/commands/flip-items';

export class SourceTransformMenu extends Menu {
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      label: $t('Edit Transform'),
      click: () => this.selectionService.openEditTransform(),
    });

    this.append({
      label: $t('Reset Transform'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'ResetTransformCommand',
          this.selectionService.getActiveSelection(),
        ),
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Stretch to Screen'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'StretchToScreenCommand',
          this.selectionService.getActiveSelection(),
        ),
    });

    this.append({
      label: $t('Fit to Screen'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'FitToScreenCommand',
          this.selectionService.getActiveSelection(),
        ),
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Center on Screen'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'CenterItemsCommand',
          this.selectionService.getActiveSelection(),
          ECenteringType.Screen,
        ),
    });

    this.append({
      label: $t('Center Horizontal'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'CenterItemsCommand',
          this.selectionService.getActiveSelection(),
          ECenteringType.Horizontal,
        ),
    });

    this.append({
      label: $t('Center Vertical'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'CenterItemsCommand',
          this.selectionService.getActiveSelection(),
          ECenteringType.Vertical,
        ),
    });

    this.append({ type: 'separator' });

    this.append({
      label: 'Flip Vertical',
      click: () =>
        this.editorCommandsService.executeCommand(
          'FlipItemsCommand',
          this.selectionService.getActiveSelection(),
          EFlipAxis.Vertical,
        ),
    });

    this.append({
      label: 'Flip Horizontal',
      click: () =>
        this.editorCommandsService.executeCommand(
          'FlipItemsCommand',
          this.selectionService.getActiveSelection(),
          EFlipAxis.Horizontal,
        ),
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Rotate 90 Degrees CW'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'RotateItemsCommand',
          this.selectionService.getActiveSelection(),
          90,
        ),
    });

    this.append({
      label: $t('Rotate 90 Degrees CCW'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'RotateItemsCommand',
          this.selectionService.getActiveSelection(),
          -90,
        ),
    });

    this.append({
      label: $t('Rotate 180 Degrees'),
      click: () =>
        this.editorCommandsService.executeCommand(
          'RotateItemsCommand',
          this.selectionService.getActiveSelection(),
          180,
        ),
    });
  }
}
