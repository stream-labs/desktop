import test from 'ava';
import { useSpectron } from '../helpers/spectron/index';
import { addSource } from '../helpers/spectron/sources';
import { logIn, blankSlate } from '../helpers/spectron/user';
import { sleep } from '../helpers/sleep';

useSpectron();

test('Set tip-jar settings', async t => {

  if (!await logIn(t)) return;

  const client = t.context.app.client;
  await logIn(t);
  await blankSlate(t);
  await addSource(t, 'The Jar', '__The Jar', false);

  const bourbonGlass = '[src="https://cdn.streamlabs.com/static/tip-jar/jars/glass-burbon.png"]';
  const activeBourbonGlass = '.active img[src="https://cdn.streamlabs.com/static/tip-jar/jars/glass-burbon.png"]';
  // Have to sleep to let render-blocking operations complete
  await sleep(2000);
  await client.click(bourbonGlass);
  await client.waitForVisible(activeBourbonGlass);

  await client.click('button=Close');
  await blankSlate(t);
  t.pass();

});
