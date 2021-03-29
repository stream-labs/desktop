import { useSpectron, focusMain, test } from '../helpers/spectron';
import {
  addSource,
  selectSource,
  clickRemoveSource,
  addExistingSource,
} from '../helpers/spectron/sources';
import { addScene } from '../helpers/spectron/scenes';

useSpectron();

test('Adding and removing a AudioSource', async t => {
  const app = t.context.app;

  await addSource(t, 'Media Source', 'Source With Audio');
  await addSource(t, 'Color Source', 'Source Without Audio');
  await focusMain(t);

  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Source With Audio')).isExisting(),
  );
  t.false(
    await (await (await app.client.$('.mixer-panel')).$('div=Source Without Audio')).isExisting(),
  );

  await selectSource(t, 'Source With Audio');
  await clickRemoveSource(t);

  await (await (await app.client.$('.mixer-panel')).$('div=Source With Audio')).waitForExist({
    timeout: 5000,
    reverse: true,
  });
});

test('Nested scenes should provide audio sources to mixer', async t => {
  const app = t.context.app;

  await addSource(t, 'Media Source', 'Nested Media Source');
  await focusMain(t);

  await addScene(t, 'New Scene');
  await addSource(t, 'Media Source', 'Simple Media Source');
  await addExistingSource(t, 'Scene', 'Scene');

  await focusMain(t);
  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Simple Media Source')).isExisting(),
  );
  t.true(
    await (await (await app.client.$('.mixer-panel')).$('div=Nested Media Source')).isExisting(),
  );
});
