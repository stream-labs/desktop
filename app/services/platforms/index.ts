import { NiconicoService } from './niconico';
import { integer } from 'aws-sdk/clients/lightsail';

export interface IChannelInfo {
  title: string;
  game: string;
}

export interface IGame {
  name: string;
}

// All platform services should implement
// this interface.
export interface IPlatformService {

  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  // This function is responsible for setting up stream
  // settings for this platform, given an auth.
  setupStreamSettings: (auth: IPlatformAuth) => Promise<void>;

  fetchViewerCount: () => Promise<number>;

  fetchStreamKey: () => Promise<string>;

  fetchChannelInfo: () => Promise<IChannelInfo>;

  putChannelInfo: (streamTitle: string, streamGame: string) => Promise<boolean>;

  searchGames: (searchString: string) => Promise<IGame[]>;

  getChatUrl: (mode: string) => Promise<string>;

  isLoggedIn?: () => Promise<boolean>;
  logout?: () => Promise<void>;

  getUserPageURL?: () => string;
}

export interface IPlatformAuth {
  apiToken: string; // N Air API Token
  platform: {
    type: TPlatform;
    username: string;
    token: string;
    id: string;
    channelId?: string;
    userIcon?: string;
  };
}

export type TPlatform = 'niconico';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    niconico: NiconicoService.instance
  }[platform];
}
