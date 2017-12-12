import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { OverlaysPersistenceService, ScenesCollectionsService } from 'services/scenes-collections';
import electron from 'electron';
import path from 'path';
import { AppService } from 'services/app';
import { WidgetsService } from 'services/widgets';
import { ScenesService } from 'services/scenes';

@Component({})
export default class OverlaySettings extends Vue {
  @Inject() overlaysPersistenceService: OverlaysPersistenceService;
  @Inject() scenesCollectionsService: ScenesCollectionsService;
  @Inject() appService: AppService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;

  busy = false;
  message = '';

  saveOverlay() {
    const chosenPath = electron.remote.dialog.showSaveDialog({
      filters: [{ name: 'Overlay File', extensions: ['overlay'] }]
    });

    if (!chosenPath) return;

    this.busy = true;
    this.message = '';

    // TODO: Expose progress to the user
    this.overlaysPersistenceService.saveOverlay(chosenPath).then(() => {
      this.busy = false;
      this.message = `Successfully saved ${path.parse(chosenPath).base}`;
    });
  }

  loadOverlay() {
    const chosenPath = electron.remote.dialog.showOpenDialog({
      filters: [{ name: 'Overlay File', extensions: ['overlay'] }]
    });

    if (!chosenPath) return;

    this.busy = true;
    this.message = '';

    const filename = path.parse(chosenPath[0]).name;
    const configName = this.scenesCollectionsService.suggestName(filename);

    this.appService.loadOverlay(configName, chosenPath[0]).then(() => {
      this.busy = false;
      this.message = `Successfully loaded ${filename}.overlay`;
    });
  }

  loadWidget() {
    const chosenPath = electron.remote.dialog.showOpenDialog({
      filters: [{ name: 'Widget File', extensions: ['widget'] }]
    });

    if (!chosenPath) return;

    this.busy = true;

    this.widgetsService.loadWidgetFile(chosenPath[0], this.scenesService.activeSceneId).then(() => {
      this.busy = false;
    });
  }
}
