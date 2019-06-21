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
  await t.context.app.client.click('button=Add Transition');
  await makeScreenshots(t, 'Add new');
  await t.context.app.client.click('button=Done');
  await t.context.app.client.click('button=Connections');
  await makeScreenshots(t, 'Connections');
  await t.context.app.client.click('button=Add Connection');
  await makeScreenshots(t, 'Add connection');
  t.pass();
});
