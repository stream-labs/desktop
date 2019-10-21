import {
  useSpectron,
  focusMain,
  focusChild,
  test,
  skipCheckingErrorsInLog,
} from './helpers/spectron/index';
import { setFormInput } from './helpers/spectron/forms';
import { FormMonkey } from './helpers/form-monkey';
import { logIn } from './helpers/spectron/user';
const moment = require('moment');
import { fetchMock, resetFetchMock } from './helpers/spectron/network';
import { goLive, prepareToGoLive } from './helpers/spectron/streaming';
import { TPlatform } from '../app/services/platforms';
import { sleep } from './helpers/sleep';

useSpectron();

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
  await setFormInput(t, 'Stream key', process.env.SLOBS_TEST_STREAM_KEY);
  await app.client.click('button=Done');

  await prepareToGoLive(t);
  await focusMain(t);
  await app.client.click('button=Go Live');

  await app.client.waitForExist('button=End Stream', 20 * 1000);
  t.pass();
});

test('Streaming to Twitch', async t => {
  // login into the account
  if (!(await logIn(t, 'twitch'))) return;

  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });

  t.pass();
});

test('Streaming to Facebook', async t => {
  // login into the account
  if (!(await logIn(t, 'facebook'))) return;

  // set stream info, and start stream
  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
    description: 'SLOBS Test Stream Description',
  });

  t.pass();
});

// TODO: We can't stream to Mixer anymore because they require channels to pass review
test.skip('Streaming to Mixer', async t => {
  // login into the account
  if (!(await logIn(t, 'mixer'))) return;

  // set stream info, and start stream
  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });
  t.pass();
});

test('Streaming to Youtube', async t => {
  // login into the account
  if (!(await logIn(t, 'youtube'))) return;

  // set stream info, and start stream
  await goLive(t, {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });

  t.pass();
});

// test scheduling for each platform
const schedulingPlatforms = ['facebook', 'youtube'];
schedulingPlatforms.forEach(platform => {
  test(`Schedule stream to ${platform}`, async t => {
    // login into the account
    if (!(await logIn(t, platform as TPlatform))) return;
    const app = t.context.app;

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button .icon-date');
    await focusChild(t);

    const formMonkey = new FormMonkey(t, 'form[name=editStreamForm]');

    // fill streaming data
    switch (platform) {
      case 'facebook':
        await formMonkey.fill({
          title: 'SLOBS Test Stream',
          game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
          description: 'SLOBS Test Stream Description',
        });
        break;

      case 'youtube':
        await formMonkey.fill({
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
      date: moment(tomorrow).format('MM/DD/YYYY'),
    });

    await app.client.click('button=Schedule');
    await app.client.waitForVisible('.toast-success', 20000);
  });
});

test('Go live error', async t => {
  // login into the account
  if (!(await logIn(t, 'twitch'))) return;
  const app = t.context.app;

  await prepareToGoLive(t);

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

test('Youtube streaming is disabled', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'youtube', { streamingIsDisabled: true });
  t.true(
    await t.context.app.client.isExisting('span=YouTube account not enabled for live streaming'),
    'The streaming-disabled message should be visible',
  );
});

test('User does not have Facebook pages', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'facebook', { noFacebookPages: true });
  const app = t.context.app;

  await prepareToGoLive(t);

  // open EditStreamInfo window
  await app.client.click('button=Go Live');
  await focusChild(t);

  t.true(
    await t.context.app.client.isExisting('a=Facebook Page Creation'),
    'The link for adding new facebook changes should exist',
  );
});

test('User has linked twitter', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'twitch', { hasLinkedTwitter: true });
  const app = t.context.app;

  await prepareToGoLive(t);

  // open EditStreamInfo window
  await app.client.click('button=Go Live');
  await focusChild(t);

  // check the "Unlink" button
  await t.context.app.client.waitForVisible('button=Unlink Twitter');
  t.true(
    await t.context.app.client.isExisting('button=Unlink Twitter'),
    'The button for unlinking Twitter should exist',
  );
});
