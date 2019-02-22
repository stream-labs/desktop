import { ISceneCollectionsServiceApi } from '../app/services/scene-collections';
import { test, useSpectron } from './helpers/spectron';
import { getClient } from './helpers/api-client';
import { logIn } from './helpers/spectron/user';

useSpectron({ appArgs: '--nosync' });

const OVERLAY_NAME = 'Talon Stream Package by VBI';
const OVERLAY_URL =
  'https://cdn.streamlabs.com/marketplace/overlays/7684923/ddcf3ea/ddcf3ea.overlay';
const OVERLAY_SCENES = ['Starting Soon', 'Be Right Back', 'Stream Ending', 'Intermission', 'Main'];

test('Installing a theme', async t => {
  const { app } = t.context;

  await logIn(t);

  await app.client.waitForExist('.top-nav.loading', 5000, true);
  await app.client.click('button=Themes');

  // This is all we can test, that webview is there
  t.true(
    await app.client.isExisting(
      '.overlays-container webview[src^="https://streamlabs.com/library"]',
    ),
  );

  // Install theme manually, as embedded library doesn't allow us to interact with elements
  await installOverlay(OVERLAY_NAME, OVERLAY_URL);

  await app.client.click('button=Editor');

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

const installOverlay = async (name: string, url: string): Promise<void> => {
  const api = await getClient();
  const sceneCollectionService = api.getResource<
    ISceneCollectionsServiceApi & { installOverlay: (url: string, name: string) => Promise<void> }
  >('SceneCollectionsService');
  await sceneCollectionService.installOverlay(OVERLAY_URL, OVERLAY_NAME);
};
