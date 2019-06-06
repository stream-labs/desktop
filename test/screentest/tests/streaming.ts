import { focusChild, focusMain, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { fillForm } from '../../helpers/form-monkey';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { TPlatform } from '../../../app/services/platforms';
import { setOutputResolution } from '../../helpers/spectron/output';

useSpectron({ appArgs: '--nosync' });
useScreentest();

// test streaming for each platform
const platforms: TPlatform[] = ['twitch', 'facebook', 'youtube', 'mixer'];
platforms.forEach(platform => {
  test(`Streaming to ${platform}`, async t => {
    // login into the account
    if (!(await logIn(t, platform))) return;
    const app = t.context.app;

    // decrease resolution to reduce CPU usage
    await setOutputResolution(t, '100x100');

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button=Go Live');
    await focusChild(t);

    // fill streaming data
    switch (platform) {
      case 'twitch':
        await fillForm(t, 'form[name=editStreamForm]', {
          stream_title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
        });
        break;

      case 'facebook':
        await fillForm(t, 'form[name=editStreamForm]', {
          stream_title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
          stream_description: 'SLOBS Test Stream Description',
        });
        break;

      case 'mixer':
        await fillForm(t, 'form[name=editStreamForm]', {
          stream_title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
        });
        break;

      case 'youtube':
        await fillForm(t, 'form[name=editStreamForm]', {
          stream_title: 'SLOBS Test Stream',
          stream_description: 'SLOBS Test Stream Description',
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
  });
});
