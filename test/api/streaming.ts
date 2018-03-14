import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IStreamingServiceApi, EStreamingState } from '../../app/services/streaming/streaming-api';
import { ISettingsServiceApi } from '../../app/services/settings';

useSpectron({ restartAppAfterEachTest: false });


test('Streaming to Twitch via API', async t => {
  if (!process.env.SLOBS_TEST_STREAM_KEY) {
    console.warn('SLOBS_TEST_STREAM_KEY not found!  Skipping streaming test.');
    t.pass();
    return;
  }

  const client = await getClient();
  const streamingService = client.getResource<IStreamingServiceApi>('StreamingService');
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');

  const streamSettings = settingsService.getSettingsFormData('Stream');
  streamSettings.forEach(subcategory => {
    subcategory.parameters.forEach(setting => {
      if (setting.name === 'service') setting.value = 'Twitch';
      if (setting.name === 'key') setting.value = process.env.SLOBS_TEST_STREAM_KEY;
    });
  });
  settingsService.setSettings('Stream', streamSettings);

  let streamingStatus = streamingService.getModel().streamingStatus;

  streamingService.streamingStatusChange.subscribe(() => void 0);

  t.is(streamingStatus, EStreamingState.Offline);

  streamingService.toggleStreaming();

  streamingStatus = await client.fetchNextEvent();
  t.is(streamingStatus, EStreamingState.Starting);

  streamingStatus = await client.fetchNextEvent();
  t.is(streamingStatus, EStreamingState.Live);

  streamingService.toggleStreaming();

  streamingStatus = await client.fetchNextEvent();
  t.is(streamingStatus, EStreamingState.Ending);

  streamingStatus = await client.fetchNextEvent();
  t.is(streamingStatus, EStreamingState.Offline);
});
