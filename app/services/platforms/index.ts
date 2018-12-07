import { TwitchService } from './twitch';
import { YoutubeService } from './youtube';
import { MixerService } from './mixer';
import { FacebookService } from './facebook';

export interface IChannelInfo {
  title: string;
  game?: string;
  description?: string;
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
  setupStreamSettings: (auth: IPlatformAuth) => void;

  fetchViewerCount: () => Promise<number>;

  fetchStreamKey: () => Promise<string>;

  fetchChannelInfo: () => Promise<IChannelInfo>;

  fetchUserInfo: () => Promise<IUserInfo>;

  putChannelInfo: (channelInfo: IChannelInfo) => Promise<boolean>;

  searchGames: (searchString: string) => Promise<IGame[]>;

  getChatUrl: (mode: string) => Promise<string>;

  beforeGoLive: () => Promise<any>;

  prepopulateInfo?: () => Promise<any>;
}

export interface IPlatformAuth {
  widgetToken: string;
  apiToken: string; // Streamlabs API Token
  platform: {
    type: TPlatform;
    username: string;
    token: string;
    id: string;
    channelId?: string;
  };
}

export interface IUserInfo {
  username?: string;
}

export type TPlatform = 'twitch' | 'youtube' | 'mixer' | 'facebook';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    twitch: TwitchService.instance,
    youtube: YoutubeService.instance,
    mixer: MixerService.instance,
    facebook: FacebookService.instance
  }[platform];
}
