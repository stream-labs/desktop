import { test, TExecutionContext, useWebdriver } from '../helpers/webdriver';
import { logIn, withPoolUser } from '../helpers/webdriver/user';
import { sleep } from '../helpers/sleep';
import {
  click,
  clickIfDisplayed,
  clickWhenDisplayed,
  focusMain,
  isDisplayed,
  waitForDisplayed,
} from '../helpers/modules/core';
import { getApiClient } from '../helpers/api-client';
import { Scene, ScenesService } from '../../app/services/api/external-api/scenes';
import { DualOutputService } from '../../app/services/dual-output';

/**
 * Testing default sources for onboarding and new users
 * @remark New users on their first login have special handling. To optimize testing,
 * some of the cases are tested within existing tests.
 *
 * CASE 1: Old user logged in during onboarding, no theme installed (Go through onboarding)
 * CASE 2: Old user logged in during onboarding, theme installed (Go through onboarding and install theme)
 * CASE 3: New user logged in during onboarding, no theme installed (Go through onboarding as a new user)
 * CASE 4: New user logged in during onboarding, theme installed (Go through onboarding as a new user and install theme)
 * CASE 5: No user logged in during onboarding, no theme installed, then log in new user (Login new user after onboarding skipped)
 * CASE 6: No user logged in during onboarding, theme installed, then log in new user (Login new user after onboarding skipped and theme installed)
 */

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver({ skipOnboarding: false });

async function confirmDefaultSources(
  t: TExecutionContext,
  scene: Scene,
  hasDefaultSources: boolean,
) {
  const defaultSources = ['Game Capture', 'Webcam', 'Alert Box'];
  const numDefaultSources = defaultSources.length;

  const numSceneItems = scene
    .getItems()
    .map(item => item.getModel())
    .reduce((sources, item) => {
      // only track number of sources that should be
      if (sources[item.sourceId] && defaultSources.includes(item.name)) {
        sources[item.sourceId] += 1;
      } else {
        sources[item.sourceId] = 1;
      }
      return sources;
    }, {} as { [sourceId: string]: number });

  if (hasDefaultSources) {
    // dual output scene collections should have 2 scene items that share a single source
    for (const [sourceId, count] of Object.entries(numSceneItems)) {
      t.is(count, 2, `Scene has dual output source ${sourceId}`);
    }

    t.is(Object.keys(numSceneItems).length, numDefaultSources, 'Scene has correct default sources');
  } else {
    // overlays installed during onboarding should have no default sources
    const numDefaultSources = Object.keys(numSceneItems).filter(
      name => defaultSources.includes(name) && numSceneItems[name] > 1,
    ).length;

    t.not(numDefaultSources, 0, 'Scene has no default sources');
  }
}

test('Go through onboarding login and signup', async t => {
  const app = t.context.app;
  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
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

// CASE 1: Old user logged in during onboarding, no theme installed
test('Go through onboarding', async t => {
  const app = t.context.app;

  await focusMain();

  if (!(await isDisplayed('h2=Live Streaming'))) return;

  await click('h2=Live Streaming');
  await click('button=Continue');

  // Click on Login on the signup page, then wait for the auth screen to appear
  await click('a=Login');
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

    await waitForDisplayed('span=Sources', { timeout: 60000 });

    // editor successfully loaded
    t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');

    const api = await getApiClient();
    const scenesService = api.getResource<ScenesService>('ScenesService');
    const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

    t.is(
      scenesService.activeScene.getItems().length,
      0,
      'New user not logged in without theme has no sources',
    );
    t.is(dualOutputService.state.dualOutputMode, false, 'Dual output not enabled.');
  });
});

// CASE 2: New user not logged in during onboarding, theme installed
test('Go through onboarding and install theme', async t => {
  const app = t.context.app;

  await focusMain();
  if (!(await isDisplayed('h2=Live Streaming'))) return;
  await click('h2=Live Streaming');
  await click('button=Continue');
  await click('a=Login');
  await isDisplayed('button=Log in with Twitch');
  const user = await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);
  await clickIfDisplayed('button=Skip');

  // Finish onboarding flow
  await withPoolUser(user, async () => {
    // Skip hardware config
    await waitForDisplayed('h1=Set up your mic & webcam');
    await clickIfDisplayed('button=Skip');

    // Skip picking a theme
    await waitForDisplayed('h1=Add your first theme');
    await clickWhenDisplayed('button=Install');

    // Skip purchasing prime
    await clickWhenDisplayed('div[data-testid=choose-free-plan-btn]', { timeout: 60000 });

    await waitForDisplayed('span=Sources', { timeout: 60000 });

    // editor successfully loaded
    t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');

    const api = await getApiClient();
    const scenesService = api.getResource<ScenesService>('ScenesService');
    const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

    t.not(
      scenesService.activeScene.getItems().length,
      0,
      'New user not logged in with theme has sources',
    );
    t.is(dualOutputService.state.dualOutputMode, false, 'Dual output not enabled.');
  });
});

// CASE 3: New user logged in during onboarding, no theme installed
test('Go through onboarding as a new user', async t => {
  // start onboarding flow
  await focusMain();
  if (!(await isDisplayed('h2=Live Streaming'))) return;
  await click('h2=Live Streaming');
  await click('button=Continue');
  await click('a=Login');
  await isDisplayed('button=Log in with Twitch');
  const user = await logIn(t, 'twitch', { prime: false }, false, true, true);
  await sleep(1000);
  await clickIfDisplayed('button=Skip');

  await withPoolUser(user, async () => {
    // finish onboarding flow
    await waitForDisplayed('h1=Set up your mic & webcam');
    await clickIfDisplayed('button=Skip');
    await waitForDisplayed('h1=Add your first theme');
    await clickIfDisplayed('button=Skip');
    await clickWhenDisplayed('div[data-testid=choose-free-plan-btn]', { timeout: 60000 });
    await waitForDisplayed('span=Sources', { timeout: 60000 });

    const api = await getApiClient();
    const scenesService = api.getResource<ScenesService>('ScenesService');
    const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

    await confirmDefaultSources(t, scenesService.activeScene, true);
    t.is(dualOutputService.state.dualOutputMode, true, 'Dual output enabled.');
  });
});

// CASE 4: New user logged in during onboarding, theme installed
test('Go through onboarding as a new user and install theme', async t => {
  const app = t.context.app;

  // start onboarding flow
  await focusMain();
  if (!(await isDisplayed('h2=Live Streaming'))) return;
  await click('h2=Live Streaming');
  await click('button=Continue');
  await click('a=Login');
  await isDisplayed('button=Log in with Twitch');
  const user = await logIn(t, 'twitch', { prime: false }, false, true, true);
  await sleep(1000);
  await clickIfDisplayed('button=Skip');

  await withPoolUser(user, async () => {
    // finish onboarding flow
    await waitForDisplayed('h1=Set up your mic & webcam');
    await clickIfDisplayed('button=Skip');
    await waitForDisplayed('h1=Add your first theme');
    await clickWhenDisplayed('button=Install');
    await clickWhenDisplayed('div[data-testid=choose-free-plan-btn]', { timeout: 60000 });
    await waitForDisplayed('span=Sources', { timeout: 60000 });

    // editor successfully loaded
    t.true(await (await app.client.$('span=Sources')).isDisplayed(), 'Sources selector is visible');

    const api = await getApiClient();
    const scenesService = api.getResource<ScenesService>('ScenesService');
    const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

    t.not(scenesService.getScenes().length, 1, 'New user has theme installed');
    t.is(dualOutputService.state.dualOutputMode, true, 'Dual output enabled.');
  });
});

// CASE 5: No user logged in during onboarding, no theme installed, then log in new user
test('Login new user after onboarding skipped', async t => {
  // start onboarding flow
  await focusMain();
  if (!(await isDisplayed('h2=Live Streaming'))) return;
  await click('h2=Live Streaming');
  await click('button=Continue');
  await clickIfDisplayed('button=Skip'); // skip login
  await clickIfDisplayed('button=Skip'); // skip hardware setup
  await clickIfDisplayed('button=Skip'); // skip theme install
  await clickIfDisplayed('button=Skip'); // skip plan selection

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  const api = await getApiClient();
  const scenesService = api.getResource<ScenesService>('ScenesService');
  const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

  t.is(
    scenesService.activeScene.getItems().length,
    0,
    'No sources after onboarding skipped before login',
  );
  t.is(dualOutputService.state.dualOutputMode, false, 'Dual output not enabled before login');

  await clickIfDisplayed('li[data-testid=nav-auth]');

  await isDisplayed('button=Log in with Twitch');
  await logIn(t, 'twitch', { prime: false }, false, false, true);
  await sleep(1000);
  await confirmDefaultSources(t, scenesService.activeScene, true);
  t.is(dualOutputService.state.dualOutputMode, true, 'Dual output enabled after login');
});

// CASE 6: No user logged in during onboarding, theme installed, then log in new user
test('Login new user after onboarding skipped and theme installed', async t => {
  // start onboarding flow
  await focusMain();
  if (!(await isDisplayed('h2=Live Streaming'))) return;
  await click('h2=Live Streaming');
  await click('button=Continue');
  await clickIfDisplayed('button=Skip'); // skip login
  await clickIfDisplayed('button=Skip'); // skip hardware setup
  await waitForDisplayed('h1=Add your first theme'); // install theme
  await clickWhenDisplayed('button=Install');
  await clickIfDisplayed('button=Skip'); // skip plan selection

  await waitForDisplayed('span=Sources', { timeout: 60000 });

  const api = await getApiClient();
  const scenesService = api.getResource<ScenesService>('ScenesService');
  const dualOutputService = api.getResource<DualOutputService>('DualOutputService');

  t.not(scenesService.getScenes().length, 1, 'Theme installed before login');
  t.is(dualOutputService.state.dualOutputMode, false, 'Dual output not enabled before login');

  await clickIfDisplayed('li[data-testid=nav-auth]');

  await isDisplayed('button=Log in with Twitch');
  await logIn(t, 'twitch', { prime: false }, false, false, true);
  await sleep(1000);
  await confirmDefaultSources(t, scenesService.activeScene, true);
  t.is(dualOutputService.state.dualOutputMode, true, 'Dual output enabled after login');
});

// TODO: refactor to updated onboarding flow and make specific assertions here once re-enabled
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
