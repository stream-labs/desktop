import {
  useSpectron,
  focusMain,
  focusChild,
  test,
  skipCheckingErrorsInLog
} from './helpers/spectron/index';
import { setFormInput } from './helpers/spectron/forms';
import { fillForm, FormMonkey } from './helpers/form-monkey';
import { logIn } from './helpers/spectron/user';
import { setOutputResolution } from './helpers/spectron/output';
const moment = require('moment');
import { sleep } from './helpers/sleep';
import { fetchMock, resetFetchMock } from './helpers/spectron/network';


useSpectron({ appArgs: '--nosync' });

test('Streaming to Twitch without auth', async t => {
  if (!process.env.SLOBS_TEST_STREAM_KEY) {
    console.warn('SLOBS_TEST_STREAM_KEY not found!  Skipping streaming test.');
    t.pass();
    return;
  }

  const app = t.context.app;

  await focusMain(t);
  await app.client.click('.side-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Stream');

  // This is the twitch.tv/slobstest stream key
  await setFormInput(
    t,
    'Stream key',
    process.env.SLOBS_TEST_STREAM_KEY
  );
  await app.client.click('button=Done');

  await setOutputResolution(t, '100x100');
  await focusMain(t);
  await app.client.click('button=Go Live');

  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});


test('Streaming to Twitch', async t => {

  // login into the account
  if (!(await logIn(t, 'twitch'))) return;
  const app = t.context.app;

  await setOutputResolution(t, '100x100');

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info, and start stream
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS'
  });
  await app.client.click('button=Confirm & Go Live');

  // check we're streaming
  await focusMain(t);
  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});

test('Streaming to Facebook', async t => {

  // login into the account
  if (!(await logIn(t, 'facebook'))) return;
  const app = t.context.app;

  // decrease resolution to reduce CPU usage
  await setOutputResolution(t, '100x100');

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info, and start stream
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
    description: 'SLOBS Test Stream Description'
  });

  await app.client.click('button=Confirm & Go Live');

  // check we're streaming
  await focusMain(t);
  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});

test('Streaming to Mixer', async t => {

  // login into the account
  if (!(await logIn(t, 'mixer'))) return;
  const app = t.context.app;

  // decrease resolution to reduce CPU usage
  await setOutputResolution(t, '100x100');

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info, and start stream
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
  });

  await app.client.click('button=Confirm & Go Live');

  // check we're streaming
  await focusMain(t);
  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});

test('Streaming to Youtube', async t => {

  // login into the account
  if (!(await logIn(t, 'youtube'))) return;
  const app = t.context.app;

  // decrease resolution to reduce CPU usage
  await setOutputResolution(t, '100x100');

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info, and start stream
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description'
  });
  await app.client.click('button=Confirm & Go Live');

  // check we're streaming
  await focusMain(t);
  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});


// test scheduling for each platform
const schedulingPlatforms = ['facebook', 'youtube'];
schedulingPlatforms.forEach(platform => {
  test(`Schedule stream to ${platform}`, async t => {
    // login into the account
    if (!(await logIn(t, platform))) return;
    const app = t.context.app;

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button=Schedule Stream');
    await focusChild(t);

    const formMonkey = new FormMonkey(t, 'form[name=editStreamForm]');
    await ({
      title: 'SLOBS Test Stream',
      game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
      description: 'SLOBS Test Stream Description',
    });


    // fill streaming data
    switch (platform) {
      case 'facebook':
        await formMonkey.fill({
          title: 'SLOBS Test Stream',
          game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
          description: 'SLOBS Test Stream Description',
        });
        break;

      case 'youtube':
        await formMonkey.fill( {
          title: 'SLOBS Test Stream',
          description: 'SLOBS Test Stream Description',
        });
        break;
    }

    await app.client.click('button=Schedule');

    // need to provide a date
    t.true(await app.client.isExisting('div=The field is required'));

    // set the date to tomorrow
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    await formMonkey.fill({
      date: moment(tomorrow).format('MM/DD/YYYY')
    });

    // TODO: youtube always returns an error: User requests exceed the rate limit
    if (platform !== 'youtube') {
      await app.client.click('button=Schedule');
      await app.client.waitForVisible('.toast-success', 20000);
    }

  });
});



test('Go live error', async t => {

  // login into the account
  if (!(await logIn(t, 'twitch'))) return;
  const app = t.context.app;

  // simulate issues with the twitch api
  await fetchMock(t, /api\.twitch\.tv/, 404);
  skipCheckingErrorsInLog();

  // open EditStreamInfo window
  await app.client.click('button=Go Live');
  await focusChild(t);

  // check that the error text is shown
  await app.client.waitForVisible('a=just go live.');

  await resetFetchMock(t);
  t.pass();
});
