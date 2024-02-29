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
  // NOT_APPROVED = 0,
  APPROVED = 1,
  APPROVED_OBS = 2,
}

export type TTikTokLiveScopeTypes = 'approved' | 'legacy' | 'denied';

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
  TIKTOK_STREAM_ACTIVE = 'user_hold_living_room_in_TikTok_Platform',
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
