import test from 'ava';
import { useSpectron, focusChild, focusMain } from '../helpers/spectron/index';
import { clickSceneTransitions } from '../helpers/spectron/scenes';
import { setFormDropdown, getFormDropdown, setFormInput, getFormInput } from '../helpers/spectron/forms';

useSpectron();


test('Changing a transition options', async t => {
  const app = t.context.app;
  const transitionType = 'fade_transition';
  const transitionDuration = 500;

  await clickSceneTransitions(t);
  await focusChild(t);
  await setFormDropdown(t, '[data-test="Form/List/type"]', transitionType);
  await setFormInput(t, '[data-test="Form/Int/duration"]', transitionDuration);
  await t.context.app.client.click('[data-test="Done"]');
  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);

  const durationValue = await getFormInput(t, '[data-test="Form/Int/duration"]');
  t.true(durationValue === transitionDuration.toString(10));

  const selectedTransitionType = await getFormDropdown(t, '[data-test="Form/List/type"]');
  t.true(selectedTransitionType.value === transitionType);

});
