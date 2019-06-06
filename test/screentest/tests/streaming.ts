import { focusChild, focusMain, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { fillForm } from '../../helpers/form-monkey';
import { useScreentest } from '../screenshoter';

useSpectron();
useScreentest({ window: 'child' });

test('Streaming to Twitch', async t => {

  // login into the account
  if (!(await logIn(t, 'twitch'))) return;
  const app = t.context.app;

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    stream_title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
  });

  t.pass();
});

test('Streaming to Facebook', async t => {

  // login into the account
  if (!(await logIn(t, 'facebook'))) return;
  const app = t.context.app;

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    stream_title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
    stream_description: 'SLOBS Test Stream Description',
  });

  t.pass();
});

test('Streaming to Mixer', async t => {

  // login into the account
  if (!(await logIn(t, 'mixer'))) return;
  const app = t.context.app;

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    stream_title: 'SLOBS Test Stream',
    game: 'PLAYERUNKNOWN\'S BATTLEGROUNDS',
  });

  t.pass();
});

test('Streaming to Youtube', async t => {

  // login into the account
  if (!(await logIn(t, 'youtube'))) return;
  const app = t.context.app;

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');

  // set stream info
  await focusChild(t);
  await fillForm(t, 'form[name=editStreamForm]', {
    stream_title: 'SLOBS Test Stream',
    stream_description: 'SLOBS Test Stream Description'
  });

  t.pass();
});
