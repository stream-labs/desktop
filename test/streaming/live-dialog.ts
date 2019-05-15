import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { getFormInput } from '../helpers/spectron/forms';
import { sleep } from '../helpers/sleep';
import { logIn } from '../helpers/spectron/user';

useSpectron({ appArgs: '--nosync' });

// TODO: to high CPU usage on CI
test.skip('Shows optimized encoder for specific games', async t => {
  const { app } = t.context;
  await logIn(t);

  await focusMain(t);
  await app.client.waitForExist('button=Go Live');
  await app.client.click('button=Go Live');
  await focusChild(t);
  await app.client.waitForExist('label=Title');

  // This part also tests game search in some way
  app.client.setValue('.multiselect__input', 'starcraft');
  const sc2Selector = '.multiselect__element=StarCraft II';

  await app.client.waitForExist(sc2Selector, 10000);
  await app.client.click(sc2Selector);

  // Unsupported games show "use optimized encoder settings" without the game
  t.true(await app.client.isExisting('.profile-default'));

  /*
   * Overwatch is a supported game, so it should display the following label:
   * "Use optimized encoder settings for Overwatch".
   * Unfortunately, something seems to be messing up webdriver and it can't find
   * 'label=Use optimized encoder settings for Overwatch'
   * so we workaround by adding a CSS class for when it's using the default profile
   */
  const owSelector = '.multiselect__element=Overwatch';
  await app.client.setValue('.multiselect__input', 'Overwa');
  await app.client.waitForExist(owSelector, 10000);
  await app.client.click(owSelector);
  await sleep(1000);
  t.false(await app.client.isExisting('.profile-default'));

  /*
   * Overwatch profile sends the following settings to AppVeyor RDP:
   *
   * {
   *   "encoder": "x264",
   *   "mode": "Advanced",
   *   "encoderOptions": "cabac=1 ref=1 deblock=0:1:0 analyse=0x3:0x3 me=dia subme=0 trellis=0 8x8dct=0 lookahead_threads=6 bframes=0 weightp=0 scenecut=0 mbtree=0 rc-lookahead=20",
   *   "preset": "ultrafast",
   *   "rescaleOutput": false,
   *   "bitrate": 2500,
   *   "outputResolution": "1280x720",
   * }
   *
   * Unfortunately, only a handful of these are actually testable. We also only test on CI as this
   * is going to be different for each developer machine.
   */
  await app.client.click('.profile input[type=checkbox]');
  await sleep(1000);
  await app.client.click('button=Confirm & Go Live');
  await focusMain(t);
  await app.client.waitForExist('button=End Stream', 20000);
  await sleep(1000);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Output');

  t.is('Advanced', await app.client.getValue('[data-name=Mode] input'));
  t.is('Software (x264)', await app.client.getValue('[data-name=Encoder] input'));
  t.is('2500', await getFormInput(t, 'Bitrate'));

  await app.client.click('button=Done');
  await focusMain(t);
  await app.client.click('button=End Stream');
  await app.client.isExisting('button=Go Live');
});
