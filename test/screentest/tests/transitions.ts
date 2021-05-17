import { useSpectron, test, focusChild, TExecutionContext } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { ScenesService } from 'services/api/external-api/scenes';
import { TransitionsService } from 'services/transitions';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Transitions', async (t: TExecutionContext) => {
  const client = await getClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const transitionService = client.getResource<TransitionsService>('TransitionsService');

  transitionService.showSceneTransitions();
  await focusChild(t);
  await makeScreenshots(t, 'No scenes');
  scenesService.createScene('New Scene');
  await makeScreenshots(t, '1 scene');
  await (await t.context.app.client.$('button=Add Transition')).click();
  await makeScreenshots(t, 'Add new');
  await (await t.context.app.client.$('button=Done')).click();
  await (await t.context.app.client.$('button=Connections')).click();
  await makeScreenshots(t, 'Connections');
  await (await t.context.app.client.$('button=Add Connection')).click();
  await makeScreenshots(t, 'Add connection');
  t.pass();
});
