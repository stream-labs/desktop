import { focusMain, TExecutionContext } from './index';
import { IPlatformAuth, TPlatform } from '../../../app/services/platforms';
import { sleep } from '../sleep';
const request = require('request');

const USER_POOL_URL = `https://slobs-users-pool.herokuapp.com`;
const USER_POOL_TOKEN = process.env.SLOBS_TEST_USER_POOL_TOKEN;
let userName: string; // keep user's name if SLOBS is logged-in

interface ITestUser {
  name: string; // must be unique
  workerId: string; // null if user is not active right now
  updated: string; // time of the last request for this user
  platforms: {
    // tokens for platforms
    username: string; // Mixer use username as an id for API requests
    type: TPlatform; // twitch, youtube, etc..
    id: string; // platform userId
    token: string; // platform token
    apiToken: string; // Streamlabs API token
    widgetToken: string; // needs for widgets showing
    channelId?: string; // for the Mixer and Facebook only
  }[];
}

export async function logOut(t: TExecutionContext) {
  await focusMain(t);
  await t.context.app.client.click('.icon-logout');
  await releaseUserInPool();
}

/**
 * Login SLOBS into user's account
 * If env.USER_POOL_TOKEN is set than request credentials from slobs-users-pool service
 * otherwise fetch credentials from ENV variables
 */
export async function logIn(
  t: TExecutionContext,
  platform: TPlatform = 'twitch',
): Promise<boolean> {
  const app = t.context.app;
  let authInfo: IPlatformAuth;

  if (userName) throw 'User already logged in';

  if (USER_POOL_TOKEN) {
    authInfo = await reserveUserFromPool(USER_POOL_TOKEN, platform);
  } else {
    authInfo = getAuthInfoFromEnv();
    if (!authInfo) {
      t.pass();
      return false;
    }
  }

  await focusMain(t);
  await app.webContents.send('testing-fakeAuth', authInfo);
  return true;
}

/**
 * UserPool has limited amount of users
 * We must let slobs-users-pool service know that we are not going to do any actions with reserved
 * account.
 */
export async function releaseUserInPool() {
  if (!userName || !USER_POOL_TOKEN) return;
  await requestUserPool(`release/${userName}`);
  userName = '';
}

/**
 * fetch credentials from ENV variables
 */
function getAuthInfoFromEnv(): IPlatformAuth {
  const env = process.env;

  const authInfo = {
    SLOBS_TEST_API_TOKEN: '',
    SLOBS_TEST_WIDGET_TOKEN: '',
    SLOBS_TEST_PLATFORM_TYPE: '',
    SLOBS_TEST_PLATFORM_TOKEN: '',
    SLOBS_TEST_PLATFORM_USER_ID: '',
    SLOBS_TEST_USERNAME: '',
  };

  let canAuth = true;
  Object.keys(authInfo).forEach(key => {
    authInfo[key] = env[key];
    if (!authInfo[key]) {
      console.warn(`Setup env.${key} to run this test`);
      canAuth = false;
    }
  });

  if (!canAuth) {
    return null;
  }

  return {
    widgetToken: authInfo.SLOBS_TEST_WIDGET_TOKEN,
    apiToken: authInfo.SLOBS_TEST_API_TOKEN,
    platform: {
      type: authInfo.SLOBS_TEST_PLATFORM_TYPE as TPlatform,
      id: authInfo.SLOBS_TEST_PLATFORM_USER_ID,
      token: authInfo.SLOBS_TEST_PLATFORM_TOKEN,
      username: authInfo.SLOBS_TEST_USERNAME,
    },
  };
}

/**
 * Fetch credentials from slobs-users-pool service, and reserve these credentials
 */
async function reserveUserFromPool(token: string, platformType: TPlatform): Promise<IPlatformAuth> {
  // try to get a user account from users-pool service
  // give it several attempts
  let user: ITestUser;
  let attempts = 3;
  while (attempts--) {
    try {
      user = await requestUserPool('reserve');
      break;
    } catch (e) {
      console.log(e);
      if (attempts) {
        console.log('retrying in 20 sec...');
        await sleep(20000);
      }
    }
  }
  if (!user) throw 'Unable to reserve a user after 3 attempts';

  // the account has been received, get tokens from it
  userName = user.name; // need to save the user's name to return it back to the pool after the test
  const platform = user.platforms.find(platform => platform.type === platformType);
  return {
    widgetToken: platform.widgetToken,
    apiToken: platform.apiToken,
    platform: {
      username: platform.username,
      type: platformType,
      id: platform.id,
      token: platform.token,
      channelId: platform.channelId,
    },
  };
}

/**
 * Make a GET request to slobs-users-pool service
 */
async function requestUserPool(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `${USER_POOL_URL}/${path}`,
        headers: { Authorization: `Bearer ${USER_POOL_TOKEN}` },
      },
      (err: any, res: any, body: any) => {
        if (err || res.statusCode !== 200) {
          reject(`Unable to request users pool ${err || body}`);
        }
        resolve(JSON.parse(body));
      },
    );
  });
}
