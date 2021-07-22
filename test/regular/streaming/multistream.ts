import { test, useSpectron } from '../../helpers/spectron';
import { clickGoLive, prepareToGoLive, stopStream, submit } from '../../helpers/modules/streaming';
import { useForm } from '../../helpers/modules/forms';
import { sleep } from '../../helpers/sleep';
import { isDisplayed, waitForDisplayed } from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';

useSpectron();

test('Multistream default mode', async t => {
  await logIn(null, { multistream: true });
  await prepareToGoLive();
  await clickGoLive();
  const { fillForm } = useForm();

  // enable all platforms
  await fillForm({
    twitch: true,
    facebook: true,
    youtube: true,
  });

  // wait until all platforms prepopulate data
  // TODO: replace `sleep` with something more reliable
  await sleep(10000);

  // add settings
  await fillForm({
    title: 'Test stream',
    description: 'Test stream description',
    twitchGame: 'Fortnite',
  });

  await submit();
  await waitForDisplayed('span=Configure the Multistream service');
  await waitForDisplayed("h1=You're live!", { timeout: 60000 });
  await stopStream();
  await t.pass();
});

test('Multistream advanced mode', async t => {
  await logIn(null, { multistream: true });
  await prepareToGoLive();
  await clickGoLive();
  const { fillForm, getInput } = useForm();


  // enable all platforms
  await fillForm({
    twitch: true,
    facebook: true,
    youtube: true,
  });

  // wait until all platforms prepopulate data
  // TODO: replace `sleep` with something more reliable



  console.log('Switch advanced mode');
  const advancedModeSwitch = await getInput('advancedMode');
  await (await advancedModeSwitch.getElement()).waitForEnabled({ timeout: 10000 });
  await advancedModeSwitch.setValue(true);

  // // switch advanced mode on
  // await fillForm({
  //   advancedMode: true,
  // });

  console.log('sleep 10s');
  await sleep(10000);
  const twitchForm = useForm('twitch-settings');
  await twitchForm.fillForm({
    customEnabled: true,
    title: 'twitch title',
    twitchGame: 'Fortnite',
    tags: ['100%'],
  });

  const youtubeForm = useForm('youtube-settings');
  await youtubeForm.fillForm({
    customEnabled: true,
    title: 'youtube title',
    description: 'youtube description',
  });

  const facebookForm = useForm('facebook-settings');
  await facebookForm.fillForm({
    customEnabled: true,
    facebookGame: 'Fortnite',
    title: 'facebook title',
    description: 'facebook description',
  });

  await submit();
  await waitForDisplayed('span=Configure the Multistream service');
  await waitForDisplayed("h1=You're live!", { timeout: 60000 });
  await stopStream();
  await t.pass();
});

//
// test('Custom stream destinations', async t => {
//   const client = t.context.app.client;
//   await logIn(t, 'twitch', { prime: true });
//
//   // fetch a new stream key
//   const user = await reserveUserFromPool(t, 'twitch');
//
//   // add new destination
//   await showSettings(t, 'Stream');
//   await click(t, 'span=Add Destination');
//   await fillForm(t, null, {
//     name: 'MyCustomDest',
//     url: 'rtmp://live.twitch.tv/app/',
//     streamKey: user.streamKey,
//   });
//   await click(t, 'button=Save');
//   t.true(await (await client.$('span=MyCustomDest')).isExisting(), 'New destination is created');
//
//   // update destinations
//   await click(t, 'i.fa-pen');
//   await fillForm(t, null, {
//     name: 'MyCustomDestUpdated',
//   });
//   await click(t, 'button=Save');
//   await t.true(
//     await (await client.$('span=MyCustomDestUpdated')).isExisting(),
//     'Destination is updated',
//   );
//
//   // add one more destination
//   await click(t, 'span=Add Destination');
//   await fillForm(t, null, {
//     name: 'MyCustomDest',
//     url: 'rtmp://live.twitch.tv/app/',
//     streamKey: user.streamKey,
//   });
//   await click(t, 'button=Save');
//   await t.false(
//     await (await client.$('span=Add Destination')).isExisting(),
//     'Do not allow more than 2 custom dest',
//   );
//
//   // open the GoLiveWindow and check destinations
//   await prepareToGoLive(t);
//   await clickGoLive(t);
//   await t.true(
//     await (await client.$('span=MyCustomDest')).isExisting(),
//     'Destination is available',
//   );
//   await click(t, 'span=MyCustomDest'); // switch the destination on
//   await tryToGoLive(t);
//   await (await client.$('span=Configure the Multistream service')).waitForExist(); // the multistream should be started
//   await stopStream(t);
//   await releaseUserInPool(user);
//
//   // delete existing destinations
//   await showSettings(t, 'Stream');
//   await click(t, 'i.fa-trash');
//   await click(t, 'i.fa-trash');
//   t.false(await (await client.$('i.fa-trash')).isExisting(), 'Destinations should be removed');
// });
