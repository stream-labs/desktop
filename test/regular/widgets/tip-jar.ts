import { test, useSpectron } from '../../helpers/spectron';
import { addSource } from '../../helpers/modules/sources';
import { logIn } from '../../helpers/spectron/user';

useSpectron();

test('Set tip-jar settings', async t => {
  if (!(await logIn(t))) return;

  const client = t.context.app.client;
  await addSource( 'The Jar', '__The Jar', false);
  const martiniGlass = '[src="https://cdn.streamlabs.com/static/tip-jar/jars/glass-martini.png"]';
  const activeMartiniGlass =
    '.active img[src="https://cdn.streamlabs.com/static/tip-jar/jars/glass-martini.png"]';
  await (await client.$(martiniGlass)).waitForDisplayed();
  await (await client.$(martiniGlass)).click();
  await (await client.$(activeMartiniGlass)).waitForDisplayed();
  t.pass();
});
