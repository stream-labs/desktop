import { Inject } from '../../services/core/injector';
import { Menu } from './Menu';
import { Source, SourcesService } from '../../services/sources';
import { ScenesService } from '../../services/scenes';
import { ClipboardService } from '../../services/clipboard';
import { SourceTransformMenu } from './SourceTransformMenu';
import { GroupMenu } from './GroupMenu';
import { SourceFiltersService } from '../../services/source-filters';
import { WidgetsService } from 'services/widgets';
import { CustomizationService } from 'services/customization';
import { SelectionService } from 'services/selection';
import { ProjectorService } from 'services/projector';
import { AudioService } from 'services/audio';
import electron from 'electron';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';

interface IEditMenuOptions {
  selectedSourceId?: string;
  showSceneItemMenu?: boolean;
  selectedSceneId?: string;
  showAudioMixerMenu?: boolean;
}

export class EditMenu extends Menu {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private clipboardService: ClipboardService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private selectionService: SelectionService;
  @Inject() private projectorService: ProjectorService;
  @Inject() private audioService: AudioService;
  @Inject() private editorCommandsService: EditorCommandsService;

  private scene = this.scenesService.getScene(this.options.selectedSceneId);

  private readonly source: Source;

  constructor(private options: IEditMenuOptions) {
    super();

    if (this.options.selectedSourceId) {
      this.source = this.sourcesService.getSource(this.options.selectedSourceId);
    } else if (this.options.showSceneItemMenu && this.selectionService.isSceneItem()) {
      this.source = this.selectionService.getItems()[0].getSource();
    }

    this.appendEditMenuItems();
  }

  private appendEditMenuItems() {
    if (this.scene) {
      this.append({
        label: $t('Paste (Reference)'),
        enabled: this.clipboardService.hasData(),
        accelerator: 'CommandOrControl+V',
        click: () => this.clipboardService.paste(),
      });

      this.append({
        label: $t('Paste (Duplicate)'),
        enabled: this.clipboardService.hasItems(),
        click: () => this.clipboardService.paste(true),
      });
    }

    const isMultipleSelection = this.selectionService.getSize() > 1;

    if (this.options.showSceneItemMenu) {
      const selectedItem = this.selectionService.getLastSelected();

      this.append({
        label: $t('Copy'),
        accelerator: 'CommandOrControl+C',
        click: () => this.clipboardService.copy(),
      });

      this.append({
        label: $t('Select All'),
        accelerator: 'CommandOrControl+A',
        click: () => this.selectionService.selectAll(),
      });
      this.append({
        label: $t('Invert Selection'),
        click: () => this.selectionService.invert(),
      });

      this.append({ type: 'separator' });

      this.append({
        label: $t('Remove'),
        accelerator: 'Delete',
        click: () => {
          this.selectionService.remove();
        },
      });

      this.append({
        label: $t('Transform'),
        submenu: this.transformSubmenu().menu,
      });

      this.append({
        label: 'Group',
        submenu: this.groupSubmenu().menu,
      });

      if (selectedItem) {
        const visibilityLabel = selectedItem.visible ? $t('Hide') : $t('Show');

        if (!isMultipleSelection) {
          this.append({
            label: visibilityLabel,
            click: () => {
              selectedItem.setVisibility(!selectedItem.visible);
            },
          });
          this.append({
            label: $t('Create Source Projector'),
            click: () => {
              this.projectorService.createProjector(selectedItem.sourceId);
            },
          });
        } else {
          this.append({
            label: $t('Show'),
            click: () => {
              this.selectionService.setVisibility(true);
            },
          });
          this.append({
            label: $t('Hide'),
            click: () => {
              this.selectionService.setVisibility(false);
            },
          });
        }
      }

      if (this.source && this.source.getPropertiesManagerType() === 'widget') {
        this.append({
          label: $t('Export Widget'),
          click: () => {
            const chosenPath = electron.remote.dialog.showSaveDialog({
              filters: [{ name: 'Widget File', extensions: ['widget'] }],
            });

            if (!chosenPath) return;

            this.widgetsService.saveWidgetFile(chosenPath, selectedItem.sceneItemId);
          },
        });
      }
    }

    if (this.selectionService.isSceneFolder()) {
      this.append({
        label: $t('Rename'),
        click: () =>
          this.scenesService.showNameFolder({
            sceneId: this.scenesService.activeSceneId,
            renameId: this.selectionService.getFolders()[0].id,
          }),
      });
    }

    if (this.source && !isMultipleSelection) {
      this.append({
        label: $t('Rename'),
        click: () => this.sourcesService.showRenameSource(this.source.sourceId),
      });

      this.append({ type: 'separator' });

      const filtersCount = this.sourceFiltersService.getFilters(this.source.sourceId).length;

      this.append({
        label: $t('Filters') + (filtersCount > 0 ? ` (${filtersCount})` : ''),
        click: () => {
          this.showFilters();
        },
      });

      this.append({
        label: $t('Copy Filters'),
        click: () => this.clipboardService.copyFilters(),
      });

      this.append({
        label: $t('Paste Filters'),
        click: () => this.clipboardService.pasteFilters(),
        enabled: this.clipboardService.hasFilters(),
      });

      this.append({ type: 'separator' });

      this.append({
        label: $t('Properties'),
        click: () => {
          this.showProperties();
        },
        enabled: this.source.hasProps(),
      });
    }

    if (!this.options.showSceneItemMenu && !this.source) {
      this.append({ type: 'separator' });

      this.append({
        label: $t('Lock Sources'),
        click: () => this.scenesService.setLockOnAllScenes(true),
      });

      this.append({
        label: $t('Unlock Sources'),
        click: () => this.scenesService.setLockOnAllScenes(false),
      });

      this.append({
        label: $t('Performance Mode'),
        type: 'checkbox',
        checked: this.customizationService.state.performanceMode,
        click: () =>
          this.customizationService.setSettings({
            performanceMode: !this.customizationService.state.performanceMode,
          }),
      });
    }

    this.append({ type: 'separator' });

    this.append({
      label: $t('Create Output Projector'),
      click: () => this.projectorService.createProjector(),
    });

    this.append({ type: 'separator' });

    this.append({
      label: `Undo ${this.editorCommandsService.nextUndoDescription}`,
      accelerator: 'CommandOrControl+Z',
      click: () => this.editorCommandsService.undo(),
      enabled: this.editorCommandsService.nextUndo != null,
    });

    this.append({
      label: `Redo ${this.editorCommandsService.nextRedoDescription}`,
      accelerator: 'CommandOrControl+Y',
      click: () => this.editorCommandsService.redo(),
      enabled: this.editorCommandsService.nextRedo != null,
    });

    if (this.options.showAudioMixerMenu) {
      this.append({ type: 'separator' });

      this.append({
        label: 'Hide',
        click: () => {
          this.editorCommandsService.executeCommand('HideMixerSourceCommand', this.source.sourceId);
        },
      });

      this.append({
        label: 'Unhide All',
        click: () => this.editorCommandsService.executeCommand('UnhideMixerSourcesCommand'),
      });
    }
  }

  private showFilters() {
    this.sourceFiltersService.showSourceFilters(this.source.sourceId);
  }

  private showProperties() {
    this.sourcesService.showSourceProperties(this.source.sourceId);
  }

  private transformSubmenu() {
    return new SourceTransformMenu();
  }

  private groupSubmenu() {
    return new GroupMenu();
  }
}
