import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron';
import { selectSource, clickSourceProperties } from './helpers/spectron/sources';

useSpectron(false);

async function clickCloseInspect(t, widgetName) {
  const app = t.context.app;

  await app.client.$(`div=${widgetName}`).$('..').$('..').$('..')
    .click('.fa-times');
}

test('Adding some starter widgets', async t => {
  const app = t.context.app;
  await focusMain(t);

  const widgetToken = 'SomeWidgetToken';
  const platform = {
    type: 'twitch',
    username: 'exampleuser',
    token: 'SomeToken',
    id: 'SomeId'
  };

  await app.webContents.send('testing-fakeAuth', {
    widgetToken,
    platform
  });

  // Select and deselect some widgets

  await app.client.click('div=Event List');
  await app.client.click('button=Remove Widget');
  await clickCloseInspect(t, 'Event List');

  await app.client.click('div=Chatbox');
  await app.client.click('button=Add Widget');
  await clickCloseInspect(t, 'Chatbox');

  await app.client.click('div=Donation Goal');
  await app.client.click('button=Add Widget');
  await clickCloseInspect(t, 'Donation Goal');

  await app.client.click('button=Next');

  t.true(await app.client.isExisting('li=Alert Box'));
  t.false(await app.client.isExisting('li=Event List'));
  t.true(await app.client.isExisting('li=The Jar'));
  t.true(await app.client.isExisting('li=Chat Box'));
  t.false(await app.client.isExisting('li=Donation Ticker'));
  t.true(await app.client.isExisting('li=Donation Goal'));

  await selectSource(t, 'Alert Box');
  await clickSourceProperties(t);
  await focusChild(t);

  const url = await app.client.$('label=URL').$('../..').getValue('input');
  t.regex(url, /SomeWidgetToken/);
});
