import { TwitchService } from './twitch';
import { YoutubeService } from './youtube';
import { MixerService } from './mixer';
import { FacebookService } from './facebook';
import { StreamingContext } from '../streaming';
import { TTwitchTag } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';

export type Tag = TTwitchTag;

export interface IChannelInfo {
  title: string;
  game?: string;
  description?: string;
  tags?: Tag[];
  availableTags?: Tag[];
}

export interface IGame {
  name: string;
}

/** Authorization scope **/
type TOAuthScope = TTwitchOAuthScope;

/** Supported capabilities of the streaming platform **/
export type TPlatformCapabilityMap = {
  /** Display and interact with chat **/
  chat: IPlatformCapabilityChat;
  /** Fetch and set stream tags **/
  tags: IPlatformCapabilityTags;
  /** Fetch and set user information **/
  'user-info': IPlatformCapabilityUserInfo;
  /** Fetch viewer count **/
  'viewer-count': IPlatformCapabilityViewerCount;
  /** Schedule streams for a latter date **/
  'stream-schedule': IPlatformCapabilityScheduleStream;
  /** Ability to check whether we're authorized to perform actions under a given scope **/
  'scope-validation': IPlatformCapabilityScopeValidation;
};

export type TPlatformCapability = keyof TPlatformCapabilityMap;

interface IPlatformCapabilityChat {
  getChatUrl: (mode: string) => Promise<string>;
}

interface IPlatformCapabilityTags {
  getAllTags: () => Promise<Tag[]>;
  getStreamTags: () => Promise<Tag[]>;
  setStreamTags: () => Promise<any>;
}

interface IPlatformCapabilityViewerCount {
  fetchViewerCount: () => Promise<number>;
}

interface IPlatformCapabilityUserInfo {
  fetchUserInfo: () => Promise<IUserInfo>;
}

interface IPlatformCapabilityScheduleStream {
  scheduleStream: (startTime: string, info: IChannelInfo) => Promise<any>;
}

interface IPlatformCapabilityScopeValidation {
  hasScope: (scope: TOAuthScope) => Promise<boolean>;
}

// All platform services should implement this interface.
export interface IPlatformService {
  capabilities: Set<TPlatformCapability>;

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService;

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

  afterGoLive?: (context?: StreamingContext) => Promise<void>;

  prepopulateInfo?: () => Promise<any>;

  scheduleStream?: (startTime: string, info: IChannelInfo) => Promise<any>;
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
    facebook: FacebookService.instance,
  }[platform];
}
