import { useSpectron, test } from '../helpers/spectron';
import {
  addSource,
  selectSource,
  clickRemoveSource,
  addExistingSource,
} from '../helpers/modules/sources';
import { addScene } from '../helpers/modules/scenes';
import { focusMain } from '../helpers/modules/core';

useSpectron();

test('Adding and removing a AudioSource', async t => {
  const app = t.context.app;

  await addSource('Media Source', 'Source With Audio');
  await addSource('Color Source', 'Source Without Audio');
  await focusMain();

  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Source With Audio')).isExisting(),
  );
  t.false(
    await (await (await app.client.$('.mixer-panel')).$('div=Source Without Audio')).isExisting(),
  );

  await selectSource('Source With Audio');
  await clickRemoveSource();

  await (await (await app.client.$('.mixer-panel')).$('div=Source With Audio')).waitForExist({
    timeout: 5000,
    reverse: true,
  });
});

test('Nested scenes should provide audio sources to mixer', async t => {
  const app = t.context.app;

  await addSource('Media Source', 'Nested Media Source');
  await focusMain();

  await addScene('New Scene');
  await addSource('Media Source', 'Simple Media Source');
  await addExistingSource('Scene', 'Scene');

  await focusMain();
  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Simple Media Source')).isExisting(),
  );
  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Nested Media Source')).isExisting(),
  );
});
