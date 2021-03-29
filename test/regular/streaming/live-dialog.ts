import { focusChild, focusMain, test, useSpectron } from '../../helpers/spectron';
import { getFormInput } from '../../helpers/spectron/forms';
import { sleep } from '../../helpers/sleep';
import { logIn } from '../../helpers/spectron/user';
import { setOutputResolution } from '../../helpers/spectron/output';

useSpectron();

// TODO: flaky on CI
test.skip('Shows optimized encoder for specific games', async t => {
  const { app } = t.context;
  await logIn(t);

  // decrease resolution to reduce CPU usage
  await setOutputResolution(t, '100x100');

  await focusMain(t);
  await (await app.client.$('button=Go Live')).waitForExist();
  await (await app.client.$('button=Go Live')).click();
  await focusChild(t);
  await (await app.client.$('label=Title')).waitForExist();

  // This part also tests game search in some way
  await (await app.client.$('.multiselect__input')).setValue('starcraft');
  const sc2Selector = '.multiselect__element=StarCraft II';

  await (await app.client.$(sc2Selector)).waitForExist({ timeout: 10000 });
  await (await app.client.$(sc2Selector)).click();

  // Unsupported games show "use optimized encoder settings" without the game
  t.true(await (await app.client.$('.profile-default')).isExisting());

  /*
   * Overwatch is a supported game, so it should display the following label:
   * "Use optimized encoder settings for Overwatch".
   * Unfortunately, something seems to be messing up webdriver and it can't find
   * 'label=Use optimized encoder settings for Overwatch'
   * so we workaround by adding a CSS class for when it's using the default profile
   */
  const owSelector = '.multiselect__element=Overwatch';
  await (await app.client.$('.multiselect__input')).setValue('Overwa');
  await (await app.client.$(owSelector)).waitForExist({ timeout: 10000 });
  await (await app.client.$(owSelector)).click();
  await sleep(1000);
  t.false(await (await app.client.$('.profile-default')).isExisting());

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
  await (await app.client.$('.profile input[type=checkbox]')).click();
  await sleep(1000);
  await (await app.client.$('button=Confirm & Go Live')).click();
  await focusMain(t);
  await (await app.client.$('button=End Stream')).waitForExist({ timeout: 20000 });
  await sleep(1000);
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild(t);
  await (await app.client.$('li=Output')).click();

  t.is('Advanced', await (await app.client.$('[data-name=Mode] input')).getValue());
  t.is('Software (x264)', await (await app.client.$('[data-name=Encoder] input')).getValue());
  t.is('2500', await getFormInput(t, 'Bitrate'));

  await (await app.client.$('button=2')).click();
  await focusMain(t);
  await (await app.client.$('button=End Stream')).click();
  await (await app.client.$('button=Go Live')).isExisting();
});
