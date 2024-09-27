import { test, useWebdriver } from '../helpers/webdriver';
import { logIn } from '../helpers/webdriver/user';
import { sleep } from '../helpers/sleep';
import {
  click,
  clickIfDisplayed,
  focusMain,
  isDisplayed,
  waitForDisplayed,
} from '../helpers/modules/core';

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver({ skipOnboarding: false });

test('Go through onboarding login and signup', async t => {
  const app = t.context.app;
  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
  await click('h2=Beginner');
  await click('button=Continue');

  t.true(await isDisplayed('h1=Sign Up'), 'Shows signup page by default');
  t.true(await isDisplayed('button=Create a Streamlabs ID'), 'Has a create Streamlabs ID button');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  await isDisplayed('button=Log in with Twitch');

  t.truthy(
    await Promise.all(
      ['Twitch', 'YouTube', 'Facebook'].map(async platform =>
        (await app.client.$(`button=Log in with ${platform}`)).isExisting(),
      ),
    ),
    'Shows login buttons for Twitch, YouTube, and Facebook',
  );

  t.truthy(
    await Promise.all(
      ['Trovo', 'TikTok', 'Dlive', 'NimoTV'].map(async platform =>
        (await app.client.$(`aria/Login with ${platform}`)).isExisting(),
      ),
    ),
    'Shows icon buttons for Trovo, TikTok, Dlive, and NimoTV',
  );

  t.true(await isDisplayed('a=Sign up'), 'Has a link to go back to Sign Up');
});

test('Go through onboarding', async t => {
  const app = t.context.app;
  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  await isDisplayed('button=Log in with Twitch');

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);

  // We seem to skip the login step after login internally
  await clickIfDisplayed('button=Skip');

  // Don't Import from OBS
  await clickIfDisplayed('div=Start Fresh');

  // Skip hardware config
  await waitForDisplayed('h1=Set Up Mic and Webcam');
  await clickIfDisplayed('button=Skip');

  // Skip picking a theme
  await waitForDisplayed('h1=Add an Overlay');
  await clickIfDisplayed('button=Skip');

  // Skip purchasing prime
  // TODO: is this timeout because of autoconfig?
  await waitForDisplayed('div=Choose Starter', { timeout: 60000 });
  await click('div=Choose Starter');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});

// TODO: this test is the same as beginner except with autoconfig, make specific assertions here once re-enabled
test.skip('Go through the onboarding and autoconfig', async t => {
  const app = t.context.app;
  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  // prettier-ignore
  await (await app.client.$('button=Log in with Twitch')).isExisting();

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);

  // We seem to skip the login step after login internally
  await clickIfDisplayed('button=Skip');

  // Don't Import from OBS
  await clickIfDisplayed('div=Start Fresh');

  // Skip hardware config
  await waitForDisplayed('h1=Set Up Mic and Webcam');
  await clickIfDisplayed('button=Skip');

  // Skip picking a theme
  await waitForDisplayed('h1=Add an Overlay');
  await clickIfDisplayed('button=Skip');

  // Start auto config
  // temporarily disable auto config until migrate to new api
  // t.true(await (await app.client.$('button=Start')).isExisting());
  // await (await app.client.$('button=Start')).click();

  // Skip purchasing prime
  // TODO: is this timeout because of autoconfig?
  await waitForDisplayed('div=Choose Starter', { timeout: 60000 });
  await click('div=Choose Starter');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});
