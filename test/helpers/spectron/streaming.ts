import { focusChild, focusMain, TExecutionContext } from './index';
import { setOutputResolution } from './output';
import { fillForm } from '../form-monkey';
import { getClient } from '../api-client';
import { ScenesService } from 'services/api/external-api/scenes';

async function addColorSource() {
  const api = await getClient();
  api
    .getResource<ScenesService>('ScenesService')
    .activeScene.createAndAddSource('MyColorSource', 'color_source');
}

export async function prepeareToGoLive(t: TExecutionContext) {
  // set low resolution to prevent intensive CPU usage
  await setOutputResolution(t, '100x100');

  // add a single source to prevent showing the No-Sources dialog
  await addColorSource();
}

export async function tryToGoLive(t: TExecutionContext, channelInfo?: Dictionary<string>) {
  await prepeareToGoLive(t);

  // open EditStreamInfo window
  const app = t.context.app;
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info, and start stream
  await focusChild(t);
  if (channelInfo) await fillForm(t, 'form[name=editStreamForm]', channelInfo);
  await app.client.waitForEnabled('button=Confirm & Go Live', 10000);
  await app.client.click('button=Confirm & Go Live');
}

export async function goLive(t: TExecutionContext, channelInfo?: Dictionary<string>) {
  await tryToGoLive(t, channelInfo);

  // check we're streaming
  await focusMain(t);
  await t.context.app.client.waitForExist('button=End Stream', 20 * 1000);
}
