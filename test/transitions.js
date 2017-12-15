import test from 'ava';
import { useSpectron, focusChild, focusMain } from './helpers/spectron/index';
import { clickSceneTransitions } from './helpers/spectron/scenes';
import { setFormDropdown, setFormInput, getFormInput } from './helpers/spectron/forms';

useSpectron();


test('Changing a transition options', async t => {
  const app = t.context.app;
  const transitionName = 'Fade';
  const transitionDuration = 500;

  await clickSceneTransitions(t);
  await focusChild(t);
  await setFormDropdown(t, 'Transition', transitionName);
  await setFormInput(t, 'Duration', transitionDuration);
  await t.context.app.client.click('button=Done');
  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);

  const durationValue = await getFormInput(t,'Duration');
  t.true(durationValue == transitionDuration);

  const transitionNameValue = await getFormInput(t,'Transition');
  t.true(transitionNameValue == transitionName);

});
