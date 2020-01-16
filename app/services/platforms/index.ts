import { ITwitchChannelInfo, ITwitchStartStreamOptions, TwitchService } from './twitch';
import { IYoutubeChannelInfo, IYoutubeStartStreamOptions, YoutubeService } from './youtube';
import { IMixerChannelInfo, IMixerStartStreamOptions, MixerService } from './mixer';
import { FacebookService, IFacebookChanelInfo, IFacebookStartStreamOptions } from './facebook';
import { TTwitchTag } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';
import { Observable } from 'rxjs';
import { IPlatformResponse } from './utils';

export type Tag = TTwitchTag;
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
  /** This service supports Streamlabs account merging within SLOBS **/
  'account-merging': IPlatformCapabilityAccountMerging;
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
  scheduleStream: (startTime: string, info: TChannelInfo) => Promise<any>;
}

interface IPlatformCapabilityScopeValidation {
  hasScope: (scope: TOAuthScope) => Promise<boolean>;
}

interface IPlatformCapabilityAccountMerging {
  mergeUrl: string;
}

/**
 * Returned from certain platform methods where particular errors
 * may require special handling.
 */
export enum EPlatformCallResult {
  /**
   * The call succeeded
   */
  Success,

  /**
   * A generic error occurred
   */
  Error,

  /**
   * The user does not have 2FA enabled on their Twitch account
   */
  TwitchTwoFactor,

  /**
   * The user does not have live-streaming enabled on their Youtube account
   */
  YoutubeStreamingDisabled,

  /**
   * The user is missing an essential Twitch scope.
   */
  TwitchScopeMissing,
}

export type TStartStreamOptions =
  | ITwitchStartStreamOptions
  | IYoutubeStartStreamOptions
  | IFacebookStartStreamOptions
  | IMixerStartStreamOptions;

export type TChannelInfo =
  | IYoutubeChannelInfo
  | ITwitchChannelInfo
  | IFacebookChanelInfo
  | IMixerChannelInfo;

// All platform services should implement this interface.
export interface IPlatformService {
  capabilities: Set<TPlatformCapability>;

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService;

  channelInfoChanged: Observable<TChannelInfo>;

  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  /**
   * Check the user's ability to stream for the current platform
   */
  validatePlatform: () => Promise<EPlatformCallResult>;

  fetchViewerCount: () => Promise<number>;

  fetchUserInfo: () => Promise<IUserInfo>;

  putChannelInfo: (channelInfo: TStartStreamOptions) => Promise<boolean>;

  searchGames: (searchString: string) => Promise<IGame[]>;

  /**
   * Sets up the stream key and live broadcast info required to go live.
   * Returns the stream key.
   */
  beforeGoLive: (options?: TStartStreamOptions) => Promise<string>;

  afterGoLive?: () => Promise<void>;

  afterStopStream?: () => Promise<void>;

  prepopulateInfo: () => Promise<TStartStreamOptions>;

  scheduleStream?: (startTime: string, info: TChannelInfo) => Promise<any>;

  fetchNewToken: () => Promise<void>;

  getHeaders: (req: IPlatformRequest, useToken: boolean | string) => Dictionary<string>;

  liveDockEnabled: () => boolean;

  /**
   * Get user-friendly error message
   */
  getErrorDescription: (error: IPlatformResponse<unknown>) => string;
}

export interface IUserAuth {
  widgetToken: string;
  apiToken: string; // Streamlabs API Token

  /**
   * Old key from when SLOBS only supported a single platform account
   * @deprecated Use `platforms` instead
   */
  platform?: IPlatformAuth;

  /**
   * The primary platform used for chat, go live window, etc
   */
  primaryPlatform: TPlatform;

  /**
   * New key that supports multiple logged in platforms
   */
  platforms?: { [platform in TPlatform]?: IPlatformAuth };

  /**
   * Session partition used to separate cookies associated
   * with this user login.
   */
  partition?: string;
}

export interface IPlatformAuth {
  type: TPlatform;
  username: string;
  token: string;
  id: string;
  channelId?: string;
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

export interface IPlatformRequest extends RequestInit {
  url: string;
}
