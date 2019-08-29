import { focusChild, focusMain, skipCheckingErrorsInLog, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { fillForm } from '../../helpers/form-monkey';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { TPlatform } from '../../../app/services/platforms';
import { setOutputResolution } from '../../helpers/spectron/output';
import { fetchMock, resetFetchMock } from '../../helpers/spectron/network';
import { getClient } from '../../helpers/api-client';
import { ScenesService } from 'services/api/external-api/scenes';

useSpectron({ appArgs: '--nosync' });
useScreentest();

async function addColorSource() {
  const api = await getClient();
  api
    .getResource<ScenesService>('ScenesService')
    .activeScene.createAndAddSource('MyColorSource', 'color_source');
}

// test streaming for each platform
const platforms: TPlatform[] = ['twitch', 'facebook', 'youtube', 'mixer'];
platforms.forEach(platform => {
  test(`Streaming to ${platform}`, async t => {
    // login into the account
    if (!(await logIn(t, platform))) return;
    const app = t.context.app;

    // decrease resolution to reduce CPU usage
    await setOutputResolution(t, '100x100');

    // add a single source to prevent showing the No-Sources dialog
    await addColorSource();

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button=Go Live');
    await focusChild(t);

    // fill streaming data
    switch (platform) {
      case 'twitch':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
          tags: ['100%', 'AMA'],
        });
        break;

      case 'facebook':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
          description: 'SLOBS Test Stream Description',
        });
        break;

      case 'mixer':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
        });
        break;

      case 'youtube':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          description: 'SLOBS Test Stream Description',
        });
        break;
    }

    await makeScreenshots(t, 'before_stream');

    await app.client.click('button=Confirm & Go Live');

    // check we're streaming
    await focusMain(t);
    await app.client.waitForExist('button=End Stream', 20 * 1000);

    // open the editStreamInfo dialog
    await app.client.click('.live-dock-info .icon-edit');
    await focusChild(t);
    await app.client.waitForExist('input', 20 * 1000);
    await makeScreenshots(t, 'in_stream');
    t.pass();
  });
});

// test scheduling for each platform
const schedulingPlatforms: TPlatform[] = ['facebook', 'youtube'];
schedulingPlatforms.forEach(platform => {
  test(`Schedule stream to ${platform}`, async t => {
    // login into the account
    if (!(await logIn(t, platform))) return;
    const app = t.context.app;

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button=Schedule Stream');
    await focusChild(t);

    // fill streaming data
    switch (platform) {
      case 'facebook':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
          description: 'SLOBS Test Stream Description',
        });
        break;

      case 'youtube':
        await fillForm(t, 'form[name=editStreamForm]', {
          title: 'SLOBS Test Stream',
          description: 'SLOBS Test Stream Description',
        });
        break;
    }

    await makeScreenshots(t, 'before schedule');
    t.pass();
  });
});

test('Go live error', async t => {
  // login into the account
  if (!(await logIn(t, 'twitch'))) return;
  const app = t.context.app;

  // add a single source to prevent showing the No-Sources dialog
  await addColorSource();

  // simulate issues with the twitch api
  await fetchMock(t, /api\.twitch\.tv/, 404);
  skipCheckingErrorsInLog();

  // open EditStreamInfo window
  await app.client.click('button=Go Live');
  await focusChild(t);

  // check that the error text is shown
  await app.client.waitForVisible('a=just go live.');
  await makeScreenshots(t, 'network error');

  await resetFetchMock(t);
  t.pass();
});
