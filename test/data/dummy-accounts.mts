import { TTikTokLiveScopeTypes } from 'services/platforms/tiktok/api.js';
import { ITestUser } from '../helpers/webdriver/user.mjs';
import { TPlatform } from 'services/platforms/index.js';

// update this list for platforms that use dummy user accounts for tests
const platforms = ['twitter', 'instagram', 'tiktok'] as const;
type DummyUserPlatforms = typeof platforms;
export type TTestDummyUserPlatforms = DummyUserPlatforms[number];

export interface IDummyTestUser extends ITestUser {
  serverUrl?: string;
  ingest?: string;
  streamUrl?: string;
  streamKey?: string;
  tikTokLiveScope?: TTikTokLiveScopeTypes;
}

/*
 * TikTok
 */

export const tikTokUserApproved: IDummyTestUser = {
  email: 'ttUser1@email.com',
  workerId: 'ttWorkerId1',
  updated: 'ttUpdatedId1',
  username: 'ttUser1',
  type: 'tiktok',
  id: 'ttId1',
  token: 'ttToken1',
  apiToken: 'ttApiToken1',
  widgetToken: 'ttWidgetToken1',
  serverUrl: 'rtmps://ttStreamUrl1:443/rtmp/',
  streamKey: 'ttStreamKey1',
  tikTokLiveScope: 'approved',
};

export const tikTokUserNotApproved: IDummyTestUser = {
  email: 'ttUser2@email.com',
  workerId: 'ttWorkerId2',
  updated: 'ttUpdatedId2',
  username: 'ttUser2',
  type: 'tiktok',
  id: 'ttId2',
  token: 'ttToken2',
  apiToken: 'ttApiToken2',
  widgetToken: 'ttWidgetToken2',
  serverUrl: 'rtmps://ttStreamUrl2:443/rtmp/',
  streamKey: 'ttStreamKey2',
  tikTokLiveScope: 'not-approved',
};

export const tikTokUserLegacy: IDummyTestUser = {
  email: 'ttUser3@email.com',
  workerId: 'ttWorkerId3',
  updated: 'ttUpdatedId3',
  username: 'ttUser3',
  type: 'tiktok',
  id: 'ttId3',
  token: 'ttToken3',
  apiToken: 'ttApiToken3',
  widgetToken: 'ttWidgetToken3',
  serverUrl: 'rtmps://ttStreamUrl3:443/rtmp/',
  streamKey: 'ttStreamKey3',
  tikTokLiveScope: 'legacy',
};

export const tikTokUserDenied: IDummyTestUser = {
  email: 'ttUser4@email.com',
  workerId: 'ttWorkerId4',
  updated: 'ttUpdatedId4',
  username: 'ttUser4',
  type: 'tiktok',
  id: 'ttId4',
  token: 'ttToken4',
  apiToken: 'ttApiToken4',
  widgetToken: 'ttWidgetToken4',
  serverUrl: 'rtmps://ttStreamUrl4:443/rtmp/',
  streamKey: 'ttStreamKey4',
  tikTokLiveScope: 'denied',
};

/**
 * Instagram
 */

export const instagramUser1: IDummyTestUser = {
  email: 'instagramUser4@email.com',
  workerId: 'instagramWorkerId4',
  updated: 'instagramUpdatedId4',
  username: 'instagramUser4',
  type: 'instagram',
  id: 'instagramId4',
  token: 'instagramToken4',
  apiToken: 'instagramApiToken4',
  streamUrl: 'rtmps://instagramStreamUrl:443/rtmp/',
  streamKey: 'instagramStreamKey4',
  widgetToken: 'instagramWidgetToken4',
};

/**
 * Twitter
 */

export const twitterUser1: IDummyTestUser = {
  email: 'twitterUser1@email.com',
  workerId: 'twitterWorkerId1',
  updated: 'twitterUpdatedId1',
  username: 'twitterUser1',
  type: 'twitter',
  id: 'twitterId1',
  token: 'twitterToken1',
  apiToken: 'twitterApiToken1',
  ingest: 'rtmps://twitterIngestUrl:443/rtmp/',
  streamKey: 'twitterStreamKey1',
  widgetToken: 'twitterWidgetToken1',
};

/**
 * Check if platform should use a dummy account with tests
 * @param platform platform for login
 * @returns If platform is of the TTestDummyUserPlatforms type
 */

export function isDummyUserPlatform(platform: TPlatform): platform is TTestDummyUserPlatforms {
  return platforms.includes(platform as TTestDummyUserPlatforms);
}

/**
 * Get dummy user account
 * @param platform platform for login
 * @param tikTokLiveScope which scope for TikTok account
 * @returns Dummy user account
 */
export function getDummyUser(
  platform: TTestDummyUserPlatforms,
  tikTokLiveScope?: TTikTokLiveScopeTypes,
): IDummyTestUser | undefined {
  if (platform === 'instagram') return instagramUser1;

  if (platform === 'twitter') return twitterUser1;

  if (platform === 'tiktok') {
    switch (tikTokLiveScope) {
      case 'approved':
        return tikTokUserApproved;
      case 'not-approved':
        return tikTokUserNotApproved;
      case 'legacy':
        return tikTokUserLegacy;
      case 'denied':
        return tikTokUserDenied;
      default:
        return tikTokUserDenied;
    }
  }
}
