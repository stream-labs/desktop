import { Inject } from '../../util/injector';
import { Menu } from './Menu';
import { WindowsService } from '../../services/window';
import { SourcesService } from '../../services/sources';
import { ScenesService } from '../../services/scenes';
import { ClipboardService } from '../../services/clipboard';
import { SourceTransformMenu } from './SourceTransformMenu';
import { SourceFiltersService } from '../../services/source-filters';
import { WidgetsService } from 'services/widgets';
import { CustomizationService } from 'services/customization';
import { SelectionService } from 'services/selection/selection';
import electron from 'electron';

interface IEditMenuOptions {
  selectedSourceId?: string;
  showSceneItemMenu?: boolean;
  selectedSceneId?: string;
}

export class EditMenu extends Menu {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private clipboardService: ClipboardService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private selectionService: SelectionService;

  private source = this.sourcesService.getSource(this.options.selectedSourceId);
  private scene = this.scenesService.getScene(this.options.selectedSceneId);

  constructor(private options: IEditMenuOptions) {
    super();

    this.appendEditMenuItems();
  }

  private appendEditMenuItems() {
    if (this.scene) {
      this.append({
        label: 'Paste (Reference)',
        enabled: this.clipboardService.hasItems(),
        accelerator: 'CommandOrControl+V',
        click: () => this.clipboardService.pasteReference()
      });

      this.append({
        label: 'Paste (Duplicate)',
        enabled: this.clipboardService.hasItems(),
        click: () => this.clipboardService.pasteDuplicate()
      });
    }

    const isMultipleSelection = this.selectionService.getSize() > 1;

    if (this.options.showSceneItemMenu) {

      const selectedItem = this.selectionService.getLastSelected();

      this.append({
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        click: () => this.clipboardService.copy()
      });

      if (this.customizationService.state.experimental.multiselect) {
        this.append({
          label: 'Select All',
          accelerator: 'CommandOrControl+A',
          click: () => this.selectionService.selectAll()
        });
        this.append({
          label: 'Invert Selection',
          click: () => this.selectionService.invert()
        });
      }


      this.append({ type: 'separator' });

      if (!isMultipleSelection) {
        this.append({
          label: 'Rename',
          click: () =>
            this.sourcesService.showRenameSource(selectedItem.sourceId)
        });
      }

      this.append({
        label: 'Remove',
        accelerator: 'Delete',
        click: () => this.selectionService.remove()
      });

      this.append({
        label: 'Transform',
        submenu: this.transformSubmenu().menu
      });

      const visibilityLabel = selectedItem.visible ? 'Hide' : 'Show';

      if (!isMultipleSelection) {
        this.append({
          label: visibilityLabel,
          click: () => {
            selectedItem.setVisibility(!selectedItem.visible);
          }
        });
      } else {
        this.append({
          label: 'Show',
          click: () => {
            this.selectionService.setVisibility(true);
          }
        });
        this.append({
          label: 'Hide',
          click: () => {
            this.selectionService.setVisibility(false);
          }
        });
      }


      if (this.source.getPropertiesManagerType() === 'widget') {
        this.append({
          label: 'Export Widget',
          click: () => {
            const chosenPath = electron.remote.dialog.showSaveDialog({
              filters: [{ name: 'Widget File', extensions: ['widget'] }]
            });

            if (!chosenPath) return;

            this.widgetsService.saveWidgetFile(chosenPath, selectedItem.sceneItemId);
          }
        });
      }
    }

    if (this.source && !isMultipleSelection) {
      this.append({ type: 'separator' });

      this.append({
        label: 'Filters',
        click: () => {
          this.showFilters();
        }
      });

      this.append({
        label: 'Copy filters',
        click: () => this.clipboardService.copyFilters()
      });

      this.append({
        label: 'Paste filters',
        click: () => this.clipboardService.pasteFilters(this.source.sourceId),
        enabled: this.clipboardService.hasFilters()
      });

      this.append({ type: 'separator' });

      this.append({
        label: 'Properties',
        click: () => {
          this.showProperties();
        },
        enabled: this.source.hasProps()
      });
    }

    if (!this.options.showSceneItemMenu && !this.source) {
      this.append({ type: 'separator' });

      this.append({
        label: 'Lock sources',
        click: () => this.scenesService.setLockOnAllScenes(true)
      });

      this.append({
        label: 'Unlock sources',
        click: () => this.scenesService.setLockOnAllScenes(false)
      });

      this.append({ type: 'separator' });

      this.append({
        label: 'Performance Mode',
        type: 'checkbox',
        checked: this.customizationService.state.performanceMode,
        click: () => this.customizationService.setSettings({
          performanceMode: !this.customizationService.state.performanceMode
        })
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
    return new SourceTransformMenu(this.scene.id);
  }
}
