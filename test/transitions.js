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

test('Adding and removing transitions', async t => {
  const app = t.context.app;

  // We need at least 2 scenes to edit transitions
  await addScene(t, 'Other Scene');

  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);
  await app.client.click('button=Add Transition');
  await dismissModal(t);
  await app.client.click('.icon-trash');
  await app.client.click('.icon-edit');
  const title = await getFormInput(t, 'Name');
  t.true(title === 'New Transition');
});

test('Changing connections', async t => {
  const app = t.context.app;
  const connectionBegin = 'Other Scene';
  const connectionTransition = 'New Transition';
  const connectionEnd = 'Scene';

  // We need at least 2 scenes to edit transitions
  await addScene(t, 'Other Scene');

  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);
  await app.client.click('button=Add Transition');
  await dismissModal(t);
  await app.client.click('button=Connections');
  await app.client.click('button=Add Connection');
  await setFormDropdown(t, 'Beginning Scene', connectionBegin);
  await setFormDropdown(t, 'Scene Transition', connectionTransition);
  await setFormDropdown(t, 'Ending Scene', connectionEnd);
  await t.context.app.client.click('button=Done');
  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);

  await app.client.click('button=Connections');
  await app.client.click('.icon-edit');
  const beginScene = await getFormInput(t, 'Beginning Scene');
  t.true(beginScene === connectionBegin);
  const transition = await getFormInput(t, 'Scene Transition');
  t.true(transition === connectionTransition);
  const endScene = await getFormInput(t, 'Ending Scene');
  t.true(endScene === connectionEnd);
});

test('Showing redudant connection warning', async t => {
  const app = t.context.app;

  // We need at least 2 scenes to edit transitions
  await addScene(t, 'Other Scene');

  await focusMain(t);
  await clickSceneTransitions(t);
  await focusChild(t);
  await app.client.click('button=Add Transition');
  await dismissModal(t);
  await app.client.click('button=Connections');
  await app.client.click('button=Add Connection');
  await dismissModal(t);
  await app.client.click('button=Add Connection');
  await dismissModal(t);

  await app.client.waitForVisible('.transition-redundant');
  t.pass();
});
