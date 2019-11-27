import { startApp, stopApp, test, useSpectron } from '../../helpers/spectron/index';
import { SceneBuilder } from '../../helpers/scene-builder';
import { getClient } from '../../helpers/api-client';
import { logIn, loginWithAuthInfo } from '../../helpers/spectron/user';

useSpectron({ noSync: false });


test('Scene-collections cloud-backup', async t => {
  // log-in and save the credentials
  const authInfo = await logIn(t);

  // build the scene
  const sceneBuilder = new SceneBuilder(await getClient());
  const sketch = `
    Folder1
      Item1: color_source
      Item2: image
  `;
  sceneBuilder.build(sketch);

  // restart the app and delete the cache dir
  await stopApp(true);
  await startApp(t);

  // since we deleted the cache dir we need to login again
  // use saved credentials to login into the same account
  await loginWithAuthInfo(t, authInfo);

  // check the scene-collection is downloaded
  t.true(sceneBuilder.isEqualTo(sketch), 'Scene collection should be downloaded');
});