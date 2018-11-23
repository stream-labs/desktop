import { Inject } from '../../util/injector';
import { Menu } from './Menu';
import { Source, SourcesService } from '../../services/sources';
import { ScenesService } from '../../services/scenes';
import { ClipboardService } from '../../services/clipboard';
import { SourceTransformMenu } from './SourceTransformMenu';
import { GroupMenu } from './GroupMenu';
import { SourceFiltersService } from '../../services/source-filters';
import { WidgetsService } from 'services/widgets';
import { CustomizationService } from 'services/customization';
import { SelectionService } from 'services/selection/selection';
import { ProjectorService } from 'services/projector';
import { AudioService } from 'services/audio';
import electron from 'electron';
import { $t } from 'services/i18n';

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

  private scene = this.scenesService.getScene(this.options.selectedSceneId);
  private source: Source;

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

    if (this.options.showAudioMixerMenu) {
      this.append({ type: 'separator' });

      this.append({
        label: 'Hide',
        click: () => {
          this.audioService.getSource(this.source.sourceId).setHidden(true);
        },
      });

      this.append({
        label: 'Unhide All',
        click: () => this.audioService.unhideAllSourcesForCurrentScene(),
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
