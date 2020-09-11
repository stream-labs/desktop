import { ServiceHelper } from 'services/core';
import { TPlatform } from '../platforms';
import { $t } from 'services/i18n';

const errorTypes = {
  PLATFORM_REQUEST_FAILED: {
    message: $t('The request to the platform failed'),
  },
  FACEBOOK_HAS_NO_PAGES: {
    message: $t('No Facebook pages were found'),
  },
  TWITCH_MISSED_OAUTH_SCOPE: {
    message: $t('Missing required oauth scope'),
  },
  PREPOPULATE_FAILED: {
    message: $t('Failed to fetch platform settings'),
  },
  SETTINGS_UPDATE_FAILED: {
    message: $t('Failed to update platform settings'),
  },
  RESTREAM_DISABLED: {
    message: $t('The Multistream server is temporarily unavailable'),
  },
  RESTREAM_SETUP_FAILED: {
    message: $t('Failed to configure the Multistream server'),
  },
  YOUTUBE_STREAMING_DISABLED: {
    message: $t('Your YouTube account not enabled for live streaming'),
  },
  YOUTUBE_PUBLISH_FAILED: {
    message: $t('Failed to publish the YouTube broadcast'),
  },
  TWEET_FAILED: {
    message: $t('Failed to post the Tweet'),
  },
  PRIME_REQUIRED: {
    message: $t('This feature is for Prime members only'),
  },
  UNKNOWN_ERROR: {
    // show this error if we caught a runtime error
    // we should treat this error as a bug in the codebase
    message: $t('An unkown error occurred'),
  },
};
export type TStreamErrorType = keyof typeof errorTypes;
const newCallProtector = Symbol('singleton');

export interface IStreamError {
  message: string;
  platform?: TPlatform;
  type: TStreamErrorType;
  details?: string;
}

export class StreamError extends Error {
  public platform?: TPlatform;
  public type: TStreamErrorType;
  public details: string;
  /**
   * returns serializable representation of the error
   */
  public getModel = () => {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      platform: this.platform,
    };
  };

  constructor(
    message: string,
    type: TStreamErrorType,
    details?: string,
    platform?: TPlatform,
    protector?: typeof newCallProtector,
  ) {
    super(message);
    this.message = message;
    this.type = type;
    this.details = details || '';
    this.platform = platform;
    // don't allow to call 'new' outside this file
    if (protector !== newCallProtector) {
      throw new Error('Use createStreamError() instead "new StreamError()"');
    }
  }
}

/**
 * create StreamError object extended from Error (has callstack)
 */
export function createStreamError(
  type: TStreamErrorType,
  details?: string,
  platform?: TPlatform,
): StreamError {
  return new StreamError(errorTypes[type].message, type, details, platform, newCallProtector);
}

/**
 * a shortcut for "throw new StreamError()"
 */
export function throwStreamError(
  type: TStreamErrorType,
  details?: string,
  platform?: TPlatform,
): never {
  throw createStreamError(type, details, platform);
}
