import { VideoService } from "app-services";
import electron from "electron";
import path, { dirname } from 'path';
import { $t } from 'services/i18n';
import { InitAfter, Inject, StatefulService } from "./core";
import { ISceneNodeAddOptions } from "./scenes";
import { ISourceApi, SourcesService } from "./sources";

export interface INVoiceCharacterSourceState {
}

// NVoiceのキャラクターの種類を定義
export const NVoiceCharacterTypes = ['near'] as const;
export type NVoiceCharacterType = typeof NVoiceCharacterTypes[number];

@InitAfter('SourcesService')
export class NVoiceCharacterService extends StatefulService<INVoiceCharacterSourceState> {
  static initialState: INVoiceCharacterSourceState = {};

  @Inject() sourcesService: SourcesService;
  @Inject() videoService: VideoService;

  init() {

  }

  getUrl(type: NVoiceCharacterType): string {
    const appPath = electron.remote.app.isPackaged
      ? dirname(electron.remote.app.getPath('exe'))
      : electron.remote.app.getAppPath();
    const url = 'file://' + path.join(appPath, 'nvoice', type, 'index.html');
    return url;
  }

  createNVoiceCharacterSource(type: NVoiceCharacterType, name?: string): { source: ISourceApi, options: ISceneNodeAddOptions } {
    const suggestedName = name || this.sourcesService.suggestName($t(`source-props.nvoice_character.${type}.name`));
    const width = 1000 / 4;
    const height = 1800 / 4;
    return {
      source: this.sourcesService.createSource(
        suggestedName,
        'browser_source',
        {
          url: this.getUrl(type),
          width,
          height,
        },
        {
          propertiesManager: 'nvoice-character',
          propertiesManagerSettings: {
            nVoiceCharacterType: type,
          },
        },
      ),
      options: {
        initialTransform: {
          position: { // 右下に配置
            x: this.videoService.baseWidth - width,
            y: this.videoService.baseHeight - height,
          }
        }
      }
    };
  }
}