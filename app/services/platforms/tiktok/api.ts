import { IPlatformRequest } from '..';

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

enum ETikTokLiveScopeReason {
  DENIED = -1,
  NOT_APPROVED = 0,
  APPROVED = 1,
  APPROVED_OBS = 2,
}

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
}

export interface ITikTokLiveRoomCreateResponse {
  stream_url: {
    name: string;
    push_url: string;
    push_key: string;
    origin_flv_pull_url: string;
    origin_hls_pull_url: string;
  };
}

export interface ITikTokLiveRoomFinishResponse {}

export enum ITikTokLiveRoomFinishReason {
  NORMAL = 0,
  PUNISH = 1,
  PUSH_ON_OTHER_DEVICE = 2,
}

export interface ITikTokError {
  code: string;
  message: string;
  log_id: string;
  http_status_code: number;
}

export enum ETikTokErrorCodes {
  ACCESS_TOKEN_INVALID = 401,
  INTERNAL_ERROR = 500,
  INVALID_FILE_UPLOAD = 400,
  INVALID_PARAMS = 400,
  RATE_LIMIT_EXCEEDED = 429,
  SCOPE_NOT_AUTHORIZED = 401,
  SCOPE_PERMISSION_MISSED = 400,
  USER_HAS_NO_LIVE_AUTH = 401,
}
