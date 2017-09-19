import { TwitchService } from './twitch';
import { YoutubeService } from './youtube';


export interface IStreamInfo {
  status: string;
  viewers: number;
  game: string;
}

export interface Game {
  name: string;
}

export interface Community {
  name: string;
  objectID: string;
}

export interface CommunityGet {
  name: string;
  _id: string;
}


// All platform services should implement
// this interface.
export interface IPlatformService {

  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  // This function is responsible for setting up stream
  // settings for this platform, given an auth.
  setupStreamSettings: (auth: IPlatformAuth) => void;

  fetchLiveStreamInfo: (platformId: string, oauthToken: string) => Promise<IStreamInfo>;

  putStreamInfo: (streamTitle: string, streamGame: string, platformId: string, oauthToken: string) => Promise<boolean>;

  searchGames: (searchString: string) => Promise<Game[]>;

  searchCommunities: (searchString: string) => Promise<Community[]>;

  getChatUrl: (username: string, oauthToken: string, mode: string) => Promise<string>;

  getStreamCommunities: (platformId: string) => Promise<CommunityGet[]>;

  putStreamCommunities: (communityIDs: string[], platformId:string, oauthToken: string) => Promise<boolean>;
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
