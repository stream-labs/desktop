import { focusMain } from './index';
import { GenericTestContext } from 'ava';
import { getPlatformService } from 'services/platforms';
import { testSourceExists, selectTestSource, clickRemoveSource } from './sources';

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
    SLOBS_TEST_PLATFORM_USER_ID: '',
    SLOBS_TEST_USERNAME: ''
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

  await app.webContents.send(
    'testing-fakeAuth',
    {
      widgetToken: authInfo.SLOBS_TEST_WIDGET_TOKEN,
      apiToken: authInfo.SLOBS_TEST_API_TOKEN,
      platform: {
        type: authInfo.SLOBS_TEST_PLATFORM_TYPE,
        id: authInfo.SLOBS_TEST_PLATFORM_USER_ID,
        token: authInfo.SLOBS_TEST_PLATFORM_TOKEN,
        username: authInfo.SLOBS_TEST_USERNAME
      }
    }
  );

  return true;
}

export const blankSlate = async (t: GenericTestContext<any>) => {
  await focusMain(t);
  while (await testSourceExists(t)) {
    await selectTestSource(t);
    await clickRemoveSource(t);
  }
};
