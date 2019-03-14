import { focusLibrary, focusMain, test, useSpectron } from './helpers/spectron';
import { logIn } from './helpers/spectron/user';
import { sleep } from './helpers/sleep';
import { FormMonkey } from './helpers/form-monkey';

useSpectron({ appArgs: '--nosync' });

const OVERLAY_NAME = 'Talon Stream Package by VBI';
const OVERLAY_SCENES = ['Starting Soon', 'Be Right Back', 'Stream Ending', 'Intermission', 'Main'];

// TODO: Test is flaky
test.skip('Installing a theme', async (t: any) => {
  const { app } = t.context;
  const formMonkey = new FormMonkey(t);

  await logIn(t);

  await app.client.waitForExist('.top-nav.loading', 5000, true);
  await app.client.click('button=Themes');

  await focusLibrary(t);

  // search a theme
  await formMonkey.setInputValue('input', OVERLAY_NAME);
  // the input field has a debounce search
  await sleep(2000);
  // wait items load
  await app.client.click('.market-item');
  // install overlay
  await app.client.click('button=Install Overlay');

  // wait for installation complete
  await focusMain(t);
  await app.client.waitForExist('.studio-page', 10000);

  // Should've loaded the overlay as a new scene collection
  t.true(await app.client.isExisting(`span=${OVERLAY_NAME}`));

  // Should've populated scenes
  for (const scene of OVERLAY_SCENES) {
    t.true(await app.client.isExisting(`li=${scene}`), `Scene ${scene} was not found`);
  }

  // Should've populated sources (this checks Starting Soon scene sources)
  for (const source of ['Talon Promo (Delete Me)', 'Starting Soon']) {
    t.true(await app.client.isExisting(`span.item-title=${source}`), `Source ${source}`);
  }
});
