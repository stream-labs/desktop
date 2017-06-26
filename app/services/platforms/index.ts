import { TwitchService } from './twitch';
import { YoutubeService } from './youtube';

// All platform services should implement
// this interface.
export interface IPlatformService {

  authWindowOptions: Electron.BrowserWindowOptions;

  authUrl: string;

  // This function is responsible for setting up stream
  // settings for this platform, given an auth.
  setupStreamSettings: (auth: IPlatformAuth) => void;

}

export interface IPlatformAuth {
  widgetToken: string;
  platform: {
    type: TPlatform;
    username: string;
    token: string;
    id: string;
  };
}

export type TPlatform = 'twitch' | 'youtube';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    twitch: TwitchService.instance,
    youtube: YoutubeService.instance
  }[platform];
}
