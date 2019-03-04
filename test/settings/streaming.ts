import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { logIn } from '../helpers/spectron/user';
import { getFormInput } from '../helpers/spectron/forms';

useSpectron({ appArgs: '--nosync' });

test('Populates stream settings while logged in', async t => {
  const { app } = t.context;

  await logIn(t);
  await app.client.waitForExist('.top-nav.loading', 5000, true);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Stream');

  t.is('Streaming Services', await getFormInput(t, 'Stream Type'));
  t.is('Twitch', await getFormInput(t, 'Service'));
  t.is('Auto (Recommended)', await getFormInput(t, 'Server'));
});

test('Populates stream key when logged in', async t => {
  const { app } = t.context;

  await logIn(t);
  await app.client.waitForExist('.top-nav.loading', 5000, true);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Stream');

  // Test that we can toggle show stream key, also helps us fetch the value
  await app.client.click('button=Show');
  t.false(await app.client.isExisting('input[type=password]'));

  // Check that is a somewhat valid Twitch stream key
  const streamKey = await getFormInput(t, 'Stream key');
  t.true(streamKey.startsWith('live_'));
  t.true(streamKey.length > 40);

  // Test that we can hide back the stream key
  await app.client.click('button=Hide');
  t.true(await app.client.isExisting('input[type=password]'));
});
