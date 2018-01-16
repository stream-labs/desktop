import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IStreamingServiceApi, IStreamingServiceState } from '../../app/services/streaming';

useSpectron({ restartAppAfterEachTest: false });


test('Streaming state change event', async t => {
  const client = await getClient();
  const streamingService = client.getResource<IStreamingServiceApi>('StreamingService');
  let streamingState: IStreamingServiceState;

  streamingService.streamingStateChange.subscribe(() => void 0);

  streamingService.startRecording();
  streamingState = await client.fetchNextEvent();

  t.is(streamingState.isRecording, true);

  streamingService.stopRecording();
  streamingState = await client.fetchNextEvent();

  t.is(streamingState.isRecording, false);

});
