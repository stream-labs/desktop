import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import {
  selectSource,
  clickSourceProperties
} from './helpers/spectron/sources';
import {
  openFiltersWindow,
  closeFilterProperties
} from './helpers/spectron/filters';
import { getFormInput, setFormDropdown } from './helpers/spectron/forms';
import {
  getInputValue,
  getInputValueId,
  getInputCheckboxValue
} from './helpers/spectron/advancedAudioSettings';

useSpectron({ skipOnboarding: false });

test.skip('Adding some starter widgets', async t => {
  const app = t.context.app;
  await focusMain(t);

  const widgetToken = 'SomeWidgetToken';
  const platform = {
    type: 'twitch',
    username: 'exampleuser',
    token: 'SomeToken',
    id: 'SomeId'
  };

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await app.webContents.send('testing-fakeAuth', {
    widgetToken,
    platform
  });

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('button=Start Fresh')) {
    await t.context.app.client.click('button=Start Fresh');
  }

  // Select and deselect some widgets

  await app.client.click('div=Event List');
  await app.client.click('button=Remove Widget');

  await app.client.click('div=Chatbox');
  await app.client.click('button=Add Widget');

  await app.client.click('div=Donation Goal');
  await app.client.click('button=Add Widget');

  await app.client.click('button=Add 4 Widgets');
  await app.client.click('a=Setup later');

  t.true(await app.client.isExisting('li=Alert Box'));
  t.false(await app.client.isExisting('li=Event List'));
  t.true(await app.client.isExisting('li=The Jar'));
  t.true(await app.client.isExisting('li=Chat Box'));
  t.false(await app.client.isExisting('li=Donation Ticker'));
  t.true(await app.client.isExisting('li=Donation Goal'));

  await selectSource(t, 'Alert Box');
  await clickSourceProperties(t);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Widget Type'));
});

test('Obs-importer', async t => {

  const unzip = require('unzip');
  const fs = require('fs');
  const app = t.context.app;

  await new Promise((resolve, reject) => {
    fs.createReadStream('test/ressources/obs-studio.zip')
      .pipe(unzip.Extract({ path: t.context.cacheDir }))
      .on('close', resolve)
      .on('error', reject);
  });

  await focusMain(t);

  const widgetToken = 'SomeWidgetToken';
  const platform = {
    type: 'twitch',
    username: 'exampleuser',
    token: 'SomeToken',
    id: 'SomeId'
  };

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await app.webContents.send('testing-fakeAuth', {
    widgetToken,
    platform
  });

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('button=Import from OBS')) {
    t.true(await app.client.isExisting('.multiselect=Game'));
    t.true(await app.client.isExisting('.multiselect=Untitled'));

    await app.client.click('button=Import from OBS');
    t.true(await app.client.isExisting('button=Continue'));

    await app.client.click('button=Continue');
    await app.client.click('button=Add 0 Widgets');
    await app.client.click('a=Setup later');

    // const sceneSelector = app.client.$('[rel=SceneSelector]');
    // const sourceSelector = app.client.$('[rel=SourceSelector]');

    // // Scenes checking
    // t.true(await sceneSelector.isExisting(`li=Basic Content`));
    // t.true(await sceneSelector.isExisting(`li=Intermediate Scene`));
    // t.true(await sceneSelector.isExisting(`li=Main Scene`));
    // t.true(await sceneSelector.isExisting(`li=Game`));

    // // Sources checking
    // t.true(await sourceSelector.isExisting(`li=Chat box`));
    // t.true(await sourceSelector.isExisting(`li=The Jar`));
    // t.true(await sourceSelector.isExisting(`li=Alert box`));
    // t.true(await sourceSelector.isExisting(`li=Video Capture Device`));
    // await sceneSelector.click('li=Intermediate Scene');
    // t.true(await sourceSelector.isExisting(`li=Basic Content`));
    // await sceneSelector.click('li=Main Scene');
    // t.true(await sourceSelector.isExisting(`li=Game`));
    // t.true(await sourceSelector.isExisting(`li=Intermediate Scene`));
    // await sceneSelector.click('li=Game');
    // t.true(await sourceSelector.isExisting(`li=Game Capture`));

    // Filter checking
    // await sceneSelector.click('li=Basic Content');
    // await openFiltersWindow(t, 'Video Capture Device');
    // await focusChild(t);

    // // Check filter current values
    // t.true(await app.client.isExisting('li=Color Correction'));
    // t.is(await getFormInput(t, 'Gamma'), '0.6');
    // t.is(await getFormInput(t, 'Contrast'), '0.67');
    // t.is(await getFormInput(t, 'Brightness'), '0');
    // t.is(await getFormInput(t, 'Saturation'), '0.78');
    // t.is(await getFormInput(t, 'Hue Shift'), '0');
    // t.is(await getFormInput(t, 'Opacity'), '100');

    // await closeFilterProperties(t);
    // await focusMain(t);

    // // Check Advanced audio settings
    await app.client.$('[rel=Mixer]').click('.studio-controls-top .fa-cog');
    await focusChild(t);

    // // Mic/Aux
    // t.true(await sourceSelector.isExisting(`td=Mic/Aux`));
    // t.is(
    //   await getInputValue(
    //     t,
    //     '.column-deflection .IntInput .input-wrapper .int-input',
    //     1
    //   ),
    //   '75'
    // );
    // t.is(
    //   await getInputCheckboxValue(t, '.column-forceMono .input-wrapper', 1),
    //   true
    // );
    // t.is(
    //   await getInputValue(
    //     t,
    //     '.column-syncOffset .IntInput .input-wrapper .int-input',
    //     1
    //   ),
    //   '0'
    // );
    // t.is(
    //   await getInputValue(t, '.column-monitoringType', 1),
    //   'Monitor Only (mute output)'
    // );
    // const mixerValues = [false, false, true, true, true, true];
    // t.deepEqual(
    //   await getInputCheckboxValue(t, '.column-audioMixers', 1),
    //   mixerValues
    // );

    // await focusMain(t);
    // await app.client.click('.fa-cog');
    // await focusChild(t);
    // t.true(await app.client.isExisting('li=Video'));
    // await app.client.click('li=Video');
    // t.is(await getFormInput(t, 'Common FPS Values'), '60');
  }
});
