import { useSpectron, focusMain, focusChild, test } from './helpers/spectron/index';
import { isLoggedIn, logIn } from './helpers/spectron/user';
import { sleep } from './helpers/sleep';

useSpectron();

test('Main and child window visibility', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.browserWindow.isVisible());
  await focusChild(t);
  t.false(await app.browserWindow.isVisible());
});

test('Twitch 2FA is disabled', async t => {
  await logIn(t, 'twitch', { '2FADisabled': true }, false);
  await sleep(5000); // TODO wait for MsgBox instead sleep;
  t.false(await isLoggedIn(t), 'User should be logged-out');
});
