import test from 'ava';
import { useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn } from '../helpers/spectron/user';

useSpectron();

test('Set stream-boss health', async t => {

  if (!await logIn(t)) return;

  const client = t.context.app.client;
  await logIn(t);
  await addSource(t, 'Stream Boss', 'Stream Boss');

  const setButtonSelector = 'button=Set Stream Boss Health';
  const resetButtonSelector = 'button=Reset Stream Boss';

  if (await client.isVisible(resetButtonSelector)) {
    await client.click(resetButtonSelector);
  }

  await client.waitForVisible(setButtonSelector);
  await client.click(setButtonSelector);
  await client.waitForVisible('div=fixed'); // 'fixed' is a default streamboss mode

  t.pass();

});

