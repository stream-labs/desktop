import { focusLibrary, focusMain, test, TExecutionContext, useSpectron } from '../helpers/spectron';
import { logIn } from '../helpers/spectron/user';
import { sleep } from '../helpers/sleep';
import { FormMonkey } from '../helpers/form-monkey';
import { sceneExisting } from '../helpers/spectron/scenes';

useSpectron();

const OVERLAY_NAME = 'Portals';
const OVERLAY_SCENES = ['Live Scene', 'Starting Soon', 'Be Right Back', 'Offline'];

test('Installing a theme', async (t: TExecutionContext) => {
  const { app } = t.context;
  const formMonkey = new FormMonkey(t);

  await logIn(t);
  await (await app.client.$('div[title=Themes]')).click();

  await focusLibrary(t);

  // search a theme
  await formMonkey.setInputValue('input', OVERLAY_NAME);

  // the input field has a debounce search
  await sleep(2000);
  // wait items load
  await (await app.client.$('.market-item')).click();

  // install overlay
  await (await app.client.$('button=Install Overlay')).waitForDisplayed();
  await sleep(2000); // wait for the scroll animation
  await (await app.client.$('button=Install Overlay')).click();

  // wait for installation complete
  await focusMain(t);
  await (await app.client.$('.editor-page')).waitForExist({ timeout: 60000 });

  // Should've loaded the overlay as a new scene collection
  t.true(await (await app.client.$(`span=${OVERLAY_NAME}`)).isExisting());

  // Should've populated scenes
  for (const scene of OVERLAY_SCENES) {
    t.true(await sceneExisting(t, scene), `Scene ${scene} was not found`);
  }

  // Should've populated sources (this checks Starting Soon scene sources)
  for (const source of ['Starting']) {
    t.true(
      await (await app.client.$(`span.item-title=${source}`)).isExisting(),
      `Source ${source}`,
    );
  }
});
