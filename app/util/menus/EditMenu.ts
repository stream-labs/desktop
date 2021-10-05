import { Inject } from '../../services/core/injector';
import { Menu } from './Menu';
import { Source, SourcesService } from '../../services/sources';
import { ScenesService, isItem } from '../../services/scenes';
import { ClipboardService } from 'services/clipboard';
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
import { ERenderingMode } from '../../../obs-api';
import { StreamingService } from 'services/streaming';
import Utils from 'services/utils';

interface IEditMenuOptions {
  selectedSourceId?: string;
  showSceneItemMenu?: boolean;
  selectedSceneId?: string;
  showAudioMixerMenu?: boolean;
}

export class EditMenu extends Menu {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService!: ScenesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private clipboardService: ClipboardService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private selectionService: SelectionService;
  @Inject() private projectorService: ProjectorService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private streamingService: StreamingService;

  private scene = this.scenesService.views.getScene(this.options.selectedSceneId);

  private readonly source: Source;

  constructor(private options: IEditMenuOptions) {
    super();

    if (this.options.selectedSourceId) {
      this.source = this.sourcesService.views.getSource(this.options.selectedSourceId);
    } else if (
      this.options.showSceneItemMenu &&
      this.selectionService.views.globalSelection.isSceneItem()
    ) {
      this.source = this.selectionService.views.globalSelection.getItems()[0].getSource();
    }

    this.appendEditMenuItems();
  }

  private appendEditMenuItems() {
    if (this.scene) {
      this.append({
        label: $t('Paste (Reference)'),
        enabled: this.clipboardService.views.hasData(),
        accelerator: 'CommandOrControl+V',
        click: () => this.clipboardService.paste(),
      });

      this.append({
        label: $t('Paste (Duplicate)'),
        enabled: this.clipboardService.views.canDuplicate(),
        click: () => this.clipboardService.paste(true),
      });
    }

    const isMultipleSelection = this.selectionService.views.globalSelection.getSize() > 1;

    if (this.options.showSceneItemMenu) {
      const selectedItem = this.selectionService.views.globalSelection.getLastSelected();

      this.append({
        label: $t('Copy'),
        accelerator: 'CommandOrControl+C',
        click: () => this.clipboardService.copy(),
      });

      this.append({
        label: $t('Select All'),
        accelerator: 'CommandOrControl+A',
        click: () => this.selectionService.views.globalSelection.selectAll(),
      });
      this.append({
        label: $t('Invert Selection'),
        click: () => this.selectionService.views.globalSelection.invert(),
      });

      this.append({ type: 'separator' });

      this.append({
        label: $t('Transform'),
        submenu: this.transformSubmenu().menu,
      });

      this.append({
        label: 'Group',
        submenu: this.groupSubmenu().menu,
      });

      if (selectedItem && isItem(selectedItem)) {
        const visibilityLabel = selectedItem.visible ? $t('Hide') : $t('Show');
        const streamVisLabel = selectedItem.streamVisible
          ? $t('Hide on Stream')
          : $t('Show on Stream');
        const recordingVisLabel = selectedItem.recordingVisible
          ? $t('Hide on Recording')
          : $t('Show on Recording');

        if (!isMultipleSelection) {
          this.append({
            label: visibilityLabel,
            click: () => {
              this.editorCommandsService.executeCommand(
                'HideItemsCommand',
                selectedItem.getSelection(),
                selectedItem.visible,
              );
            },
          });
          this.append({
            label: streamVisLabel,
            click: () => {
              selectedItem.setStreamVisible(!selectedItem.streamVisible);
            },
            enabled: this.streamingService.state.selectiveRecording,
          });
          this.append({
            label: recordingVisLabel,
            click: () => {
              selectedItem.setRecordingVisible(!selectedItem.recordingVisible);
            },
            enabled: this.streamingService.state.selectiveRecording,
          });
          this.append({
            label: $t('Create Source Projector'),
            click: () => {
              this.projectorService.createProjector(
                ERenderingMode.OBS_MAIN_RENDERING,
                selectedItem.sourceId,
              );
            },
          });
        } else {
          this.append({
            label: $t('Show'),
            click: () => {
              this.editorCommandsService.executeCommand(
                'HideItemsCommand',
                this.selectionService.views.globalSelection,
                false,
              );
            },
          });
          this.append({
            label: $t('Hide'),
            click: () => {
              this.editorCommandsService.executeCommand(
                'HideItemsCommand',
                this.selectionService.views.globalSelection,
                true,
              );
            },
          });
        }

        if (this.source && this.source.getPropertiesManagerType() === 'widget') {
          this.append({
            label: $t('Export Widget'),
            click: () => {
              electron.remote.dialog
                .showSaveDialog({
                  filters: [{ name: 'Widget File', extensions: ['widget'] }],
                })
                .then(({ filePath }) => {
                  if (!filePath) return;

                  this.widgetsService.saveWidgetFile(filePath, selectedItem.sceneItemId);
                });
            },
          });
        }
      }
    }

    if (this.selectionService.views.globalSelection.isSceneFolder()) {
      this.append({
        label: $t('Rename'),
        click: () =>
          this.scenesService.showNameFolder({
            sceneId: this.scenesService.views.activeSceneId,
            renameId: this.selectionService.views.globalSelection.getFolders()[0].id,
          }),
      });
    }

    if (this.source) {
      this.append({
        label: $t('Remove'),
        accelerator: 'Delete',
        click: () => {
          // if scene items are selected than remove the selection
          if (this.options.showSceneItemMenu) {
            this.selectionService.actions.removeSelected();
          } else {
            // if no items are selected we are in the MixerSources context menu
            // if a simple source is selected than remove all sources from the current scene
            if (!this.source.channel) {
              const scene = this.scenesService.views.activeScene;
              const itemsToRemoveIds = scene
                .getItems()
                .filter(item => item.sourceId === this.source.sourceId)
                .map(item => item.id);

              this.editorCommandsService.executeCommand(
                'RemoveNodesCommand',
                scene.getSelection(itemsToRemoveIds),
              );
            } else {
              // remove a global source
              electron.remote.dialog
                .showMessageBox(electron.remote.getCurrentWindow(), {
                  title: 'Streamlabs OBS',
                  message: $t('This source will be removed from all of your scenes'),
                  type: 'warning',
                  buttons: [$t('Cancel'), $t('OK')],
                })
                .then(({ response }) => {
                  if (!response) return;
                  this.editorCommandsService.executeCommand(
                    'RemoveSourceCommand',
                    this.source.sourceId,
                  );
                });
            }
          }
        },
      });

      if (this.source.type === 'browser_source') {
        this.append({
          label: $t('Interact'),
          click: () => this.sourcesService.showInteractWindow(this.source.sourceId),
        });
      }
    }

    if (this.source && !isMultipleSelection) {
      this.append({
        label: $t('Rename'),
        click: () => this.sourcesService.showRenameSource(this.source.sourceId),
      });

      this.append({ type: 'separator' });

      this.append({
        label: $t('Performance Mode'),
        type: 'checkbox',
        checked: this.customizationService.state.performanceMode,
        click: () =>
          this.customizationService.setSettings({
            performanceMode: !this.customizationService.state.performanceMode,
          }),
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
        click: () => this.clipboardService.copyFilters(this.source.sourceId),
      });

      this.append({
        label: $t('Paste Filters'),
        click: () => this.clipboardService.pasteFilters(this.source.sourceId),
        enabled: this.clipboardService.views.hasFilters(),
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
      click: () => this.projectorService.createProjector(ERenderingMode.OBS_MAIN_RENDERING),
    });

    this.append({
      label: $t('Create Stream Output Projector'),
      click: () => this.projectorService.createProjector(ERenderingMode.OBS_STREAMING_RENDERING),
      enabled: this.streamingService.state.selectiveRecording || Utils.isDevMode(),
    });

    this.append({
      label: $t('Create Recording Output Projector'),
      click: () => this.projectorService.createProjector(ERenderingMode.OBS_RECORDING_RENDERING),
      enabled: this.streamingService.state.selectiveRecording || Utils.isDevMode(),
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Undo %{action}', { action: this.editorCommandsService.nextUndoDescription }),
      accelerator: 'CommandOrControl+Z',
      click: () => this.editorCommandsService.undo(),
      enabled: this.editorCommandsService.nextUndo != null,
    });

    this.append({
      label: $t('Redo %{action}', { action: this.editorCommandsService.nextRedoDescription }),
      accelerator: 'CommandOrControl+Y',
      click: () => this.editorCommandsService.redo(),
      enabled: this.editorCommandsService.nextRedo != null,
    });

    if (this.options.showAudioMixerMenu) {
      this.append({ type: 'separator' });

      this.append({
        label: $t('Hide'),
        click: () => {
          this.editorCommandsService.executeCommand('HideMixerSourceCommand', this.source.sourceId);
        },
      });

      this.append({
        label: $t('Unhide All'),
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
