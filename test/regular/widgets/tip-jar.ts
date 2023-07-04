import { test, useWebdriver } from '../../helpers/webdriver';
import { addSource } from '../../helpers/modules/sources';
import { logIn } from '../../helpers/webdriver/user';

useWebdriver();

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
