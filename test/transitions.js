import test from 'ava';
import { useSpectron, focusChild, focusMain } from './helpers/spectron/index';
import { clickSceneTransitions, addScene } from './helpers/spectron/scenes';
import { setFormDropdown, setFormInput, getFormInput } from './helpers/spectron/forms';
import { dismissModal } from './helpers/spectron/modals';

useSpectron();


test('Changing transition options', async t => {
  const app = t.context.app;
  const transitionType = 'Fade';
  const transitionDuration = 500;

  // We need at least 2 scenes to edit transitions
  await addScene(t, 'Other Scene');

  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);
  await app.client.click('.icon-edit');
  await setFormDropdown(t, 'Type', transitionType);
  await setFormInput(t, 'Duration', transitionDuration);
  await dismissModal(t);
  await t.context.app.client.click('button=Done');
  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);

  await app.client.click('.icon-edit');
  const durationValue = await getFormInput(t,'Duration');
  t.true(durationValue == transitionDuration);
  const transitionNameValue = await getFormInput(t,'Type');
  t.true(transitionNameValue == transitionType);
});
