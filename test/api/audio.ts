import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { sleep } from '../helpers/sleep';
import { IAudioServiceApi } from 'services/audio';
import { IScenesServiceApi } from 'services/scenes';
import { IAppServiceApi } from '../../app/services/app/app-api';

useSpectron({ restartAppAfterEachTest: false});


test('The default sources exists', async t => {
  const client = await getClient();
  const audioService = client.getResource<IAudioServiceApi>('AudioService');
  const audioSources = audioService.getSourcesForCurrentScene();

  t.is(audioSources.length, 2);

});


test('The sources with audio have to be appeared in AudioService', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const audioService = client.getResource<IAudioServiceApi>('AudioService');

  const scene = scenesService.activeScene;
  scene.createAndAddSource('MyAudio', 'wasapi_output_capture');
  const audioSources = audioService.getSourcesForCurrentScene();

  t.is(audioSources.length, 3);
});


test('The audio sources have to keep settings after application restart', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const audioService = client.getResource<IAudioServiceApi>('AudioService');
  const appService = client.getResource<IAppServiceApi>('AppService');

  const scene = scenesService.activeScene;
  const source = scene.createAndAddSource('MyMic', 'wasapi_input_capture');
  const audioSource = audioService.getSource(source.sourceId);

  audioSource.setSettings({
    audioMixers: 1,
    monitoringType: 1,
    forceMono: true,
    syncOffset: 10,
    muted: true
  });

  const audioSourceModel = audioSource.getModel();

  // reload config
  await appService.loadConfig('scenes');

  const loadedAudioSourceModel = audioService.getSource(source.sourceId).getModel();

  t.deepEqual(audioSourceModel, loadedAudioSourceModel);

});
