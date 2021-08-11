import { logIn } from '../../helpers/modules/user';
import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming';
import { test, useSpectron } from '../../helpers/spectron';

useSpectron();

test('Streaming to a Facebook Page', async t => {
  await logIn('facebook', { multistream: false });
  await goLive({
    title: 'SLOBS Test Stream',
    facebookGame: 'Fortnite',
    description: 'SLOBS Test Stream Description',
  });
  t.true(await chatIsVisible(), 'Chat should be visible');
  await stopStream();
  t.pass();
});

// TODO: update expired permissions
test.skip('Streaming to a Facebook User`s group', async t => {
  await logIn('facebook', { hasFBGroup: true });
  await goLive({
    title: 'SLOBS Test Stream',
    facebookGame: 'Doom',
    description: 'SLOBS Test Stream Description',
    destinationType: 'group',
  });
  await stopStream();
  t.pass();
});

// TODO: update expired permissions
test.skip('Streaming to a Facebook User`s timeline', async t => {
  await logIn('facebook', { allowStreamingToFBTimeline: true });
  await goLive({
    title: 'SLOBS Test Stream',
    facebookGame: 'Doom',
    description: 'SLOBS Test Stream Description',
    destinationType: 'me',
  });
  await stopStream();
  t.pass();
});
