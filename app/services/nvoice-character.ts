import electron from "electron";
import path, { dirname } from 'path';
import { $t } from 'services/i18n';
import { InitAfter, Inject, StatefulService } from "./core";
import { ISourceApi, SourcesService } from "./sources";

export interface INVoiceCharacterSourceState {

}

@InitAfter('SourcesService')
export class NVoiceCharacterService extends StatefulService<INVoiceCharacterSourceState> {
  static initialState: INVoiceCharacterSourceState = {};

  @Inject() sourcesService: SourcesService;

  init() {

  }

  getUrl(): string {
    const appPath = electron.remote.app.isPackaged
      ? dirname(electron.remote.app.getPath('exe'))
      : electron.remote.app.getAppPath();
    const url = 'file://' + path.join(appPath, 'nvoice', 'near', 'index.html');
    return url;
  }

  createNVoiceCharacterSource(name?: string): ISourceApi {
    const suggestedName = name || this.sourcesService.suggestName($t('source-props.nvoice_character.name'));
    return this.sourcesService.createSource(
      suggestedName,
      'browser_source',
      {
        url: this.getUrl(),
        width: 1000 / 4,
        height: 1800 / 4,
      },
      {
        propertiesManager: 'nvoice-character',
      },
    );
  }
}