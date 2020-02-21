import { focusLibrary, focusMain, test, useSpectron } from './helpers/spectron';
import { logIn } from './helpers/spectron/user';
import { sleep } from './helpers/sleep';
import { FormMonkey } from './helpers/form-monkey';
import { sceneExisting } from './helpers/spectron/scenes';

useSpectron({ pauseIfFailed: true });

const OVERLAY_NAME = 'Portals';
const OVERLAY_SCENES = ['Live Scene', 'Starting Soon', 'Be Right Back', 'Offline'];

test('Installing a theme', async (t: any) => {
  const { app } = t.context;
  const formMonkey = new FormMonkey(t);

  await logIn(t);

  // await app.client.waitForExist('button=themes', 5000, true);
  console.log('try click themes');
  await app.client.click('div[title=Themes]');
  console.log('themes clicked');

  await focusLibrary(t);
  console.log('library focused');

  // search a theme
  await formMonkey.setInputValue('input', OVERLAY_NAME);
  console.log('input typed');
  // the input field has a debounce search
  await sleep(2000);
  // wait items load
  await app.client.click('.market-item');
  console.log('item clicked');
  // install overlay
  await app.client.waitForVisible('button=Install Overlay');
  await app.client.click('button=Install Overlay');
  console.log('install clicked');

  // wait for installation complete
  await focusMain(t);
  await app.client.waitForExist('.editor-page', 60000);
  console.log('install completed');

  // Should've loaded the overlay as a new scene collection
  t.true(await app.client.isExisting(`span=${OVERLAY_NAME}`));

  // Should've populated scenes
  for (const scene of OVERLAY_SCENES) {
    t.true(await sceneExisting(t, scene), `Scene ${scene} was not found`);
  }

  // Should've populated sources (this checks Starting Soon scene sources)
  for (const source of ['Starting']) {
    t.true(await app.client.isExisting(`span.item-title=${source}`), `Source ${source}`);
  }
});
