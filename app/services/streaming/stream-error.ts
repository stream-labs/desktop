import { getPlatformService, TPlatform } from '../platforms';
import { $t } from 'services/i18n';
import { Services } from '../../components-react/service-provider';

// the `message` is shown to the user in the error notification
// the `action` is included in the diag report for further specificity
// about the error for debugging and support
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
  DUAL_OUTPUT_RESTREAM_DISABLED: {
    get message() {
      return $t('The Multistream server is temporarily unavailable for Dual Output');
    },
  },
  DUAL_OUTPUT_SETUP_FAILED: {
    get message() {
      return $t('Failed to configure the Dual Output service');
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
  FACEBOOK_STREAMING_DISABLED: {
    get message() {
      return $t(
        "You're not eligible to Go Live, your profile needs to be at least 60 days old and your page needs to have at least 100 followers",
      );
    },
  },
  TIKTOK_OAUTH_EXPIRED: {
    get message() {
      return $t('Failed to authenticate with TikTok, re-login or re-merge TikTok account');
    },
    get action() {
      return $t('re-login or re-merge TikTok account');
    },
  },
  TIKTOK_SCOPE_OUTDATED: {
    get message() {
      return $t('Failed to update TikTok account');
    },
    get action() {
      return $t('unlink and re-merge TikTok account, then restart Desktop');
    },
  },
  TIKTOK_STREAM_SCOPE_MISSING: {
    get message() {
      return $t('Your TikTok account is not enabled for live streaming');
    },
    get action() {
      return $t('confirm Live Access status with TikTok');
    },
  },
  TIKTOK_STREAM_ACTIVE: {
    get message() {
      return $t('You are already live on a another device');
    },
    get action() {
      return $t('end stream on other device to start');
    },
  },
  TIKTOK_GENERATE_CREDENTIALS_FAILED: {
    get message() {
      return $t('Error generating TikTok stream credentials');
    },
    get action() {
      return $t('confirm streaming approval status with TikTok');
    },
  },
  PRIME_REQUIRED: {
    get message() {
      return $t('This feature is for Ultra members only');
    },
  },
  MACHINE_LOCKED: {
    message: 'Your computer is locked',
  },
  UNKNOWN_STREAMING_ERROR: {
    get message() {
      return $t('Unknown error, please contact support');
    },
    get action() {
      return $t(
        'request rejected by streaming platform. Confirm go live settings, streaming approval status and output settings',
      );
    },
  },
  UNKNOWN_STREAMING_ERROR_MESSAGE: {
    get message() {
      return $t('Streaming to platform is temporarily not available');
    },
    get action() {
      return $t(
        'request rejected by streaming platform. If error shows the user is blocked, do not say that they are blocked but instead ask them to confirm their streaming status with the platform',
      );
    },
  },
  UNKNOWN_ERROR: {
    // show this error if we caught a runtime error
    // we should treat this error as a bug in the codebase
    get message() {
      return $t('An unknown error occurred');
    },
    get action() {
      return $t('escalate to the engineering team');
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
  action?: string;
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
