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

  waitForDisplayed('h2=Live Streaming');

  await click('h2=Live Streaming');
  await click('h2=Beginner');
  await click('button=Continue');

  t.true(await isDisplayed('h1=Sign Up'), 'Shows signup page by default');
  t.true(await isDisplayed('button=Create a Streamlabs ID'), 'Has a create Streamlabs ID button');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');

  t.truthy(
    await Promise.all(
      ['Twitch', 'YouTube', 'Facebook', 'Twitter', 'TikTok'].map(async platform =>
        waitForDisplayed(`button=Log in with ${platform}`),
      ),
    ),
    'Shows login buttons for Twitch, YouTube, Facebook, Twitter and TikTok',
  );

  t.truthy(
    await Promise.all(
      ['Trovo', 'Dlive', 'NimoTV'].map(async platform =>
        waitForDisplayed(`aria/Log in with ${platform}`),
      ),
    ),
    'Shows icon buttons for Trovo, Dlive, and NimoTV',
  );

  t.true(await isDisplayed('a=Sign up'), 'Has a link to go back to Sign Up');
});

test('Go through onboarding as beginner user', async t => {
  const app = t.context.app;
  await focusMain();

  waitForDisplayed('h2=Live Streaming');

  await click('h2=Live Streaming');
  // Choose Beginner onboarding
  await click('h2=Beginner');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  waitForDisplayed('button=Log in with Twitch');

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

  // Click Get Started after seeing tips
  t.true(
    await isDisplayed('span=Set yourself up for success with our getting started guide'),
    'Shows beginner tips',
  );
  await clickIfDisplayed('button=Get Started');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});

// TODO: this is the same as beginner as of the current flow, aside page diffs just asserts tips are different
test('Go through onboarding as intermediate user', async t => {
  const app = t.context.app;
  await focusMain();

  waitForDisplayed('h2=Live Streaming');

  await click('h2=Live Streaming');
  // Choose Intermediate onboarding
  await click('h2=Intermediate');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  waitForDisplayed('button=Log in with Twitch');

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

  // Click Get Started after seeing tips
  t.true(
    await isDisplayed('span=Set up your alerts and widgets on Streamlabs Dashboard'),
    'Shows intermediate tips',
  );
  await clickIfDisplayed('button=Get Started');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  // prettier-ignore
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});

test('Go through onboarding as advanced user', async t => {
  const app = t.context.app;
  await focusMain();

  waitForDisplayed('h2=Live Streaming');

  await click('h2=Live Streaming');
  // Choose Advanced onboarding
  await click('h2=Advanced');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  waitForDisplayed('button=Log in with Twitch');

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);

  // We seem to skip the login step after login internally
  await clickIfDisplayed('button=Skip');

  // Don't Import from OBS
  await clickIfDisplayed('div=Start Fresh');

  // Skip hardware config
  await waitForDisplayed('h1=Set Up Mic and Webcam');
  await clickIfDisplayed('button=Skip');

  // Skip purchasing prime
  // TODO: is this timeout because of autoconfig?
  await waitForDisplayed('div=Choose Starter', { timeout: 60000 });
  await click('div=Choose Starter');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  // prettier-ignore
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});

// TODO: this test is the same as beginner except with autoconfig, make specific assertions here once re-enabled
test.skip('Go through the onboarding and autoconfig', async t => {
  const app = t.context.app;
  await focusMain();

  waitForDisplayed('h2=Live Streaming');

  await click('h2=Live Streaming');
  await click('h2=Beginner');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
  // prettier-ignore
  waitForDisplayed('button=Log in with Twitch');

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

  // Click Get Started after seeing tips
  t.true(
    await isDisplayed('span=Set yourself up for success with our getting started guide'),
    'Shows beginner tips',
  );
  await clickIfDisplayed('button=Get Started');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});
