import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { SceneCollectionsService } from 'services/scene-collections/index';
import { OverlaysPersistenceService } from 'services/scene-collections/overlays';
import { CustomizationService } from 'services/customization';
import electron from 'electron';
import path from 'path';
import { AppService } from 'services/app/index';
import { WidgetsService } from 'services/widgets/index';
import { ScenesService } from 'services/scenes/index';
import { $t } from 'services/i18n/index';
import { BoolInput } from 'components/shared/inputs/inputs';

@Component({ components: { BoolInput } })
export default class OverlaySettings extends Vue {
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() overlaysPersistenceService: OverlaysPersistenceService;
  @Inject() appService: AppService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;
  @Inject() customizationService: CustomizationService;

  busy = false;
  message = '';

  get mediaBackupOptOut(): boolean {
    return this.customizationService.state.mediaBackupOptOut;
  }

  set mediaBackupOptOut(value: boolean) {
    this.customizationService.setMediaBackupOptOut(value);
  }

  async saveOverlay() {
    const { filePath } = await electron.remote.dialog.showSaveDialog({
      filters: [{ name: 'Overlay File', extensions: ['overlay'] }],
    });

    if (!filePath) return;

    this.busy = true;
    this.message = '';

    // TODO: Expose progress to the user
    this.overlaysPersistenceService.saveOverlay(filePath).then(() => {
      this.busy = false;
      this.message = $t('Successfully saved %{filename}', {
        filename: path.parse(filePath).base,
      });
    });
  }

  async loadOverlay() {
    const chosenPath = (
      await electron.remote.dialog.showOpenDialog({
        filters: [{ name: 'Overlay File', extensions: ['overlay'] }],
      })
    ).filePaths;

    if (!chosenPath[0]) return;

    this.busy = true;
    this.message = '';

    const filename = path.parse(chosenPath[0]).name;
    const configName = this.sceneCollectionsService.suggestName(filename);

    this.sceneCollectionsService.loadOverlay(chosenPath[0], configName).then(() => {
      this.busy = false;
      this.message = $t('Successfully loaded %{filename}.overlay', { filename });
    });
  }

  async loadWidget() {
    const chosenPath = (
      await electron.remote.dialog.showOpenDialog({
        filters: [{ name: 'Widget File', extensions: ['widget'] }],
      })
    ).filePaths;

    if (!chosenPath[0]) return;

    this.busy = true;
    this.message = '';

    this.widgetsService
      .loadWidgetFile(chosenPath[0], this.scenesService.views.activeSceneId)
      .then(() => {
        this.busy = false;
      });
  }

  button(title: string, fn: () => void) {
    return (
      <button class="button button--action" disabled={this.busy} onClick={fn}>
        {title}
        {this.busy && <i class="fa fa-spinner fa-pulse" />}
      </button>
    );
  }

  render() {
    return (
      <div>
        <div class="section">
          <p>
            {$t(
              'This feature is intended for overlay designers to export their work for our Theme Store. Not all sources will be exported, use at your own risk.',
            )}
          </p>
          {this.button($t('Export Overlay File'), () => this.saveOverlay())}
          {this.button($t('Import Overlay File'), () => this.loadOverlay())}
          <br />
          {this.message}
        </div>
        <div class="section">
          {this.button($t('Import Widget File in Current Scene'), () => this.loadWidget())}
        </div>
        <div class="section">
          <div class="section-content">
            <BoolInput
              vModel={this.mediaBackupOptOut}
              title={$t('Do not back up my media files in the cloud (requires app restart)')}
              name="media_backup_opt_out"
            />
          </div>
        </div>
      </div>
    );
  }
}
