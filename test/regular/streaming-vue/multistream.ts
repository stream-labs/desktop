import { click, test, useSpectron } from '../../helpers/spectron';
import { logIn, releaseUserInPool, reserveUserFromPool } from '../../helpers/spectron/user';
import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  tryToGoLive,
} from '../../helpers/spectron/streaming';
import { fillForm, selectTitle } from '../../helpers/form-monkey';
import { sleep } from '../../helpers/sleep';
import { showSettings } from '../../helpers/spectron/settings';

useSpectron();

test('Multistream default mode', async t => {
  const client = t.context.app.client;
  await logIn(t, null, { multistream: true });
  await prepareToGoLive(t);
  await clickGoLive(t);

  // enable all platforms
  await fillForm(t, null, {
    twitch: true,
    facebook: true,
    youtube: true,
  });

  // wait until all platforms prepopulate data
  await sleep(2000);

  // add settings
  await fillForm(t, null, {
    title: 'Test stream',
    description: 'Test stream description',
    twitchGame: selectTitle('Fortnite'),
  });

  await submit(t);
  t.true(
    await (await client.$('span=Configure the Multistream service')).isExisting(),
    'Mutlistream should be enabled',
  );
  await (await client.$("h1=You're live!")).waitForDisplayed({ timeout: 60000 });
  await stopStream(t);
});

test('Multistream advanced mode', async t => {
  const client = t.context.app.client;
  await logIn(t, null, { multistream: true });
  await prepareToGoLive(t);
  await clickGoLive(t);

  // enable all platforms
  await fillForm(t, null, {
    twitch: true,
    facebook: true,
    youtube: true,
  });

  // wait until all platforms prepopulate data
  await sleep(2000);

  // switch advanced mode on
  await fillForm(t, null, {
    advancedMode: true,
  });

  await fillForm(t, 'form[name="twitch-settings"]', {
    customEnabled: true,
    title: 'twitch title',
    twitchGame: selectTitle('Fortnite'),
    tags: ['100%'],
  });

  await fillForm(t, 'form[name="youtube-settings"]', {
    customEnabled: true,
    title: 'youtube title',
    description: 'youtube description',
  });

  await fillForm(t, 'form[name="facebook-settings"]', {
    customEnabled: true,
    facebookGame: selectTitle('Fortnite'),
    title: 'facebook title',
    description: 'facebook description',
  });

  await submit(t);
  t.true(
    await (await client.$('span=Configure the Multistream service')).isExisting(),
    'Mutlistream should be enabled',
  );
  await (await client.$("h1=You're live!")).waitForDisplayed({ timeout: 60000 });
  await stopStream(t);
});

test('Custom stream destinations', async t => {
  const client = t.context.app.client;
  await logIn(t, 'twitch', { prime: true });

  // fetch a new stream key
  const user = await reserveUserFromPool(t, 'twitch');

  // add new destination
  await showSettings(t, 'Stream');
  await click(t, 'span=Add Destination');
  await fillForm(t, null, {
    name: 'MyCustomDest',
    url: 'rtmp://live.twitch.tv/app/',
    streamKey: user.streamKey,
  });
  await click(t, 'button=Save');
  t.true(await (await client.$('span=MyCustomDest')).isExisting(), 'New destination is created');

  // update destinations
  await click(t, 'i.fa-pen');
  await fillForm(t, null, {
    name: 'MyCustomDestUpdated',
  });
  await click(t, 'button=Save');
  await t.true(
    await (await client.$('span=MyCustomDestUpdated')).isExisting(),
    'Destination is updated',
  );

  // add one more destination
  await click(t, 'span=Add Destination');
  await fillForm(t, null, {
    name: 'MyCustomDest',
    url: 'rtmp://live.twitch.tv/app/',
    streamKey: user.streamKey,
  });
  await click(t, 'button=Save');
  await t.false(
    await (await client.$('span=Add Destination')).isExisting(),
    'Do not allow more than 2 custom dest',
  );

  // open the GoLiveWindow and check destinations
  await prepareToGoLive(t);
  await clickGoLive(t);
  await t.true(
    await (await client.$('span=MyCustomDest')).isExisting(),
    'Destination is available',
  );
  await click(t, 'span=MyCustomDest'); // switch the destination on
  await tryToGoLive(t);
  await (await client.$('span=Configure the Multistream service')).waitForExist(); // the multistream should be started
  await stopStream(t);
  await releaseUserInPool(user);

  // delete existing destinations
  await showSettings(t, 'Stream');
  await click(t, 'i.fa-trash');
  await click(t, 'i.fa-trash');
  t.false(await (await client.$('i.fa-trash')).isExisting(), 'Destinations should be removed');
});
