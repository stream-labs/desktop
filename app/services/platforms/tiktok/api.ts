import { TPlatform } from '..';

export type TTikTokScope =
  | 'live.room.info'
  | 'live.room.manage'
  | 'research.adlib.basic'
  | 'research.data.basic'
  | 'user.info.basic'
  | 'user.info.profile'
  | 'user.info.stats'
  | 'video.list'
  | 'video.publish'
  | 'video.upload';

export enum ETikTokLiveRoomDestinations {
  OBS = 1,
  STREAMLABS = 2,
}

export enum ETikTokLiveScopeReason {
  DENIED = -1,
  NOT_APPROVED = 0,
  APPROVED = 1,
  APPROVED_OBS = 2,
}

export type TTikTokLiveScopeTypes = 'approved' | 'not-approved' | 'legacy' | 'denied';

export interface ITikTokUserInfoResponse {
  data: {
    user: {
      username: string;
    };
  };
}

export interface ITikTokLiveScopeResponse {
  can_be_live: boolean;
  reason: ETikTokLiveScopeReason;
  platform: TPlatform | string;
  user: ITikTokUserData;
}

export interface ITikTokUserData {
  open_id?: string;
  union_id?: string;
  username: string;
  avatar_url?: string;
  is_verified?: false;
  likes_count?: number;
  video_count?: number;
  display_name?: string;
  follower_count?: number;
  following_count?: number;
  profile_deep_link?: string;
}

export interface ITikTokError {
  code: string;
  message: string;
  log_id: string;
  http_status_code: number;
}

export enum ETikTokErrorTypes {
  ACCESS_TOKEN_INVALID = 'access_token_invalid',
  INTERNAL_ERROR = 'internal_error',
  INVALID_FILE_UPLOAD = 'invalid_file_upload',
  INVALID_PARAMS = 'invalid_params',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SCOPE_NOT_AUTHORIZED = 'scope_not_authorized',
  SCOPE_PERMISSION_MISSED = 'scope_permission_missed',
  USER_HAS_NO_LIVE_AUTH = 'user_has_no_live_auth',
  TIKTOK_ALREADY_LIVE = 'user_already_live',
  OK = 'ok',
}

export interface ITikTokStartStreamResponse {
  key: string;
  rtmp: string;
  id: string;
}

export interface ITikTokEndStreamResponse {
  success: boolean;
}
