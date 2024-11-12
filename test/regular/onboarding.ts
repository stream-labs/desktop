import { test, useWebdriver } from '../helpers/webdriver';
import { logIn, logOut, withPoolUser } from '../helpers/webdriver/user';
import { sleep } from '../helpers/sleep';
import {
  click,
  clickIfDisplayed,
  focusMain,
  isDisplayed,
  waitForDisplayed,
  clickWhenDisplayed,
} from '../helpers/modules/core';

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver({ skipOnboarding: false });

test('Go through onboarding', async t => {
  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
  await click('button=Continue');

  // Signup page
  t.true(await isDisplayed('h1=Sign Up'), 'Shows signup page by default');
  t.true(await isDisplayed('button=Create a Streamlabs ID'), 'Has a create Streamlabs ID button');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');

  // Check for all the login buttons
  t.true(await isDisplayed('button=Log in with Twitch'), 'Shows Twitch button');
  t.true(await isDisplayed('button=Log in with YouTube'), 'Shows YouTube button');
  t.true(await isDisplayed('button=Log in with Facebook'), 'Shows Facebook button');
  t.true(await isDisplayed('button=Log in with TikTok'), 'Shows TikTok button');

  // Check for all the login icons
  t.true(await isDisplayed('[datatest-id=platform-icon-button-trovo]'), 'Shows Trovo button');
  t.true(await isDisplayed('[datatest-id=platform-icon-button-dlive]'), 'Shows Dlive button');
  t.true(await isDisplayed('[datatest-id=platform-icon-button-nimotv]'), 'Shows NimoTV button');

  t.true(await isDisplayed('a=Sign up'), 'Has a link to go back to Sign Up');

  // Complete login
  await isDisplayed('button=Log in with Twitch');
  const user = await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);
  // We seem to skip the login step after login internally
  await clickIfDisplayed('button=Skip');

  // Finish onboarding flow
  await withPoolUser(user, async () => {
    // Skip hardware config
    await waitForDisplayed('h1=Set up your mic & webcam');
    await clickIfDisplayed('button=Skip');

    // Skip picking a theme
    await waitForDisplayed('h1=Add your first theme');
    await clickIfDisplayed('button=Skip');

    // Skip purchasing prime
    await clickWhenDisplayed('div[data-testid=choose-free-plan-btn]', { timeout: 60000 });

    t.true(await isDisplayed('span=Sources'), 'Sources selector is visible');
  });

  t.pass();
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
  await waitForDisplayed('h1=Set up your mic & webcam');
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
  await waitForDisplayed('div[data-testid=choose-free-plan-btn]', { timeout: 60000 });
  await click('div[data-testid=choose-free-plan-btn]');

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  // success?
  t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');
});
