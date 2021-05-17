import { useSpectron, focusMain, focusChild, test } from '../helpers/spectron';
import { logIn } from '../helpers/spectron/user';
import { sleep } from '../helpers/sleep';

useSpectron();

test('Main and child window visibility', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.browserWindow.isVisible());
  await focusChild(t);
  t.false(await app.browserWindow.isVisible());
});

// TODO: Enable this test
test.skip('Twitch 2FA is disabled', async t => {
  await logIn(t, 'twitch', { '2FADisabled': true, notStreamable: true }, false);
  await sleep(5000); // TODO wait for MsgBox instead sleep;

  // Login did not work, we should still be logged out
  t.true(await (await t.context.app.client.$('h1=Connect')).isDisplayed());
});
