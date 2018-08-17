import { focusMain } from './index';
import { GenericTestContext } from 'ava';

const user = {
  apiToken: '05154bcaeb38c5e9d88481950',
  widgetToken: '7862F8372D62E4EE98BB',
  platform: {
    id: '248300137',
    token: '2cfjx7j0nlbcggyw6kb53wg8x1jz3g',
    username: 'alexstreamlabs'
  }
};

export async function logOut(t: GenericTestContext<any>) {
  await focusMain(t);
  await t.context.app.client.click('.icon-logout');
}

export async function logIn(t: GenericTestContext<any>): Promise<boolean> {
  const app = t.context.app;
  const env = process.env;

  let authInfo = {
    SLOBS_TEST_API_TOKEN: '',
    SLOBS_TEST_WIDGET_TOKEN: '',
    SLOBS_TEST_PLATFORM_TYPE: '',
    SLOBS_TEST_PLATFORM_TOKEN: '',
    SLOBS_TEST_PLATFORM_USER_ID: ''
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
    t.pass();
    return false;
  }

  await focusMain(t);
  
  await app.webContents.send('testing-fakeAuth', {
    widgetToken: authInfo.SLOBS_TEST_WIDGET_TOKEN,
    apiToken: authInfo.SLOBS_TEST_API_TOKEN,
    platform: {
      type: authInfo.SLOBS_TEST_PLATFORM_TYPE,
      id: authInfo.SLOBS_TEST_PLATFORM_USER_ID,
      token: authInfo.SLOBS_TEST_PLATFORM_TOKEN,
      username: 'StreamlabsUITest'
    }
  });

  return true;
}
