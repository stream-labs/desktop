import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { sleep } from '../helpers/sleep';

useSpectron({ restartAppAfterEachTest: false, initApiClient: true });


test('The default sources exists', async t => {
  const client = await getClient();
  const audioSources = client.requestSync('AudioService', 'getSourcesForCurrentScene');

  t.is(audioSources.length, 2);

});

//
// test('The sources with audio have to be appeared in AudioService', async t => {
//   const client = await getClient();
//
//   const scene = await client.request('ScenesService', 'activeScene');
//   client.request(scene.resourceId, 'createAndAddSource', 'MyAudio', 'wasapi_output_capture');
//   const audioSources = await client.request('AudioService', 'getSourcesForCurrentScene');
//
//   t.is(audioSources.length, 3);
// });
//
//
// test('The audio sources have to keep settings after application restart', async t => {
//   const client = await getClient();
//
//   const scene = await client.request('ScenesService', 'activeScene');
//   const source = await client.request(scene.resourceId, 'createAndAddSource', 'MyMic', 'wasapi_input_capture');
//   const audioSource = await client.request('AudioService', 'getSource', source.sourceId);
//
//   await client.request(audioSource.resourceId, 'setSettings', {
//     audioMixers: 1,
//     monitoringType: 1,
//     forceMono: true,
//     syncOffset: 10,
//     muted: true
//   });
//
//   const audioSourceModel = await client.request(audioSource.resourceId, 'getModel');
//
//
//   await t.context.app.restart();
//
//   // wait while config will be loaded
//   await sleep(5000);
//
//   const loadedAudioSource = await client.request('AudioService', 'getSource', source.sourceId);
//   const loadedAudioSourceModel = await client.request(loadedAudioSource.resourceId, 'getModel');
//
//   t.deepEqual(audioSourceModel, loadedAudioSourceModel);
//
// });
