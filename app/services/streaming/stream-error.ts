import { ServiceHelper } from 'services/core';
import { getPlatformService, TPlatform } from '../platforms';
import { $t } from 'services/i18n';
import { Services } from '../../components-react/service-provider';
import { platform } from 'os';

export const errorTypes = {
  PLATFORM_REQUEST_FAILED: {
    get message() {
      return $t('The request to the platform failed');
    },
  },
  TWITCH_MISSED_OAUTH_SCOPE: {
    get message() {
      return $t('Missing required oauth scope');
    },
  },
  TWITCH_BANNED_WORDS: {
    get message() {
      return $t('Your stream title or description contain banned words');
    },
  },
  PREPOPULATE_FAILED: {
    get message() {
      return $t('Failed to fetch platform settings');
    },
  },
  SETTINGS_UPDATE_FAILED: {
    get message() {
      return $t('Failed to update platform settings');
    },
  },
  RESTREAM_DISABLED: {
    get message() {
      return $t('The Multistream server is temporarily unavailable');
    },
  },
  RESTREAM_SETUP_FAILED: {
    get message() {
      return $t('Failed to configure the Multistream server');
    },
  },
  YOUTUBE_STREAMING_DISABLED: {
    get message() {
      return $t('Your YouTube account is not enabled for live streaming');
    },
  },
  YOUTUBE_THUMBNAIL_UPLOAD_FAILED: {
    get message() {
      return $t('Failed to upload the thumbnail');
    },
  },
  TWEET_FAILED: {
    get message() {
      return $t('Failed to post the Tweet');
    },
  },
  PRIME_REQUIRED: {
    get message() {
      return $t('This feature is for Prime members only');
    },
  },
  MACHINE_LOCKED: {
    message: 'Your computer is locked',
  },
  UNKNOWN_ERROR: {
    // show this error if we caught a runtime error
    // we should treat this error as a bug in the codebase
    get message() {
      return $t('An unkown error occurred');
    },
  },
};
export type TStreamErrorType = keyof typeof errorTypes;
const newCallProtector = Symbol('singleton');

export interface IRejectedRequest {
  url?: string;
  status?: number;
  statusText?: string;
}

export interface IStreamError extends IRejectedRequest {
  message: string;
  platform?: TPlatform;
  type: TStreamErrorType;
  details?: string;
}

export class StreamError extends Error implements IRejectedRequest {
  public type: TStreamErrorType;
  public details?: string;
  public url?: string;
  public status?: number;
  public statusText?: string;
  public platform?: TPlatform;

  /**
   * returns serializable representation of the error
   */
  public getModel = () => {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
    };
  };

  constructor(
    message: string,
    type: TStreamErrorType,
    rejectedRequest?: IRejectedRequest,
    details?: string,
    protector?: typeof newCallProtector,
  ) {
    super(message);
    this.message = message;
    this.type = type;
    this.details = details || '';
    this.url = rejectedRequest?.url;
    this.status = rejectedRequest?.status;
    this.statusText = rejectedRequest?.statusText;
    this.platform = this.url ? getPlatform(this.url) : undefined;

    // TODO: remove sensitive data from YT requests
    if (this.platform === 'youtube') {
      this.url = '';
    }

    // don't allow to call 'new' outside this file
    if (protector !== newCallProtector) {
      throw new Error('Use createStreamError() instead "new StreamError()"');
    }
  }
}

function getPlatform(url: string): TPlatform | undefined {
  const platforms = Services.StreamingService.views.linkedPlatforms;
  return platforms.find(platform => url.startsWith(getPlatformService(platform).apiBase));
}

/**
 * create StreamError object extended from Error (has callstack)
 */
export function createStreamError(
  type: TStreamErrorType,
  rejectedRequest?: IRejectedRequest,
  details?: string,
): StreamError {
  return new StreamError(
    errorTypes[type].message,
    type,
    rejectedRequest,
    details,
    newCallProtector,
  );
}

/**
 * a shortcut for "throw new StreamError()"
 */
export function throwStreamError(
  type: TStreamErrorType,
  rejectedRequest?: IRejectedRequest,
  details?: string,
): never {
  throw createStreamError(type, rejectedRequest, details);
}
